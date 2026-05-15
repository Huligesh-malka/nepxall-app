import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api/api";

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const BASE_URL = process.env.REACT_APP_API_URL?.replace("/api", "") || "https://nepxall-backend.onrender.com";

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

const formatPrice = (price) => {
  if (!price || price === "0" || price === 0) return "0";
  const numPrice = Number(price);
  if (isNaN(numPrice)) return "0";
  return numPrice.toLocaleString('en-IN');
};

// Image Slider Component
const ImageSlider = ({ media }) => {
  const [index, setIndex] = useState(0);
  
  if (!media || media.length === 0) {
    return (
      <div className="no-media">
        <span>📷</span>
        <p>No photos available</p>
      </div>
    );
  }

  const current = media[index];

  return (
    <div className="slider">
      {current.type === "photo" ? (
        <img src={current.src} alt="Property" />
      ) : (
        <video src={current.src} controls />
      )}
      
      {media.length > 1 && (
        <>
          <button className="nav-btn left" onClick={() => setIndex(i => i === 0 ? media.length - 1 : i - 1)}>◀</button>
          <button className="nav-btn right" onClick={() => setIndex(i => (i + 1) % media.length)}>▶</button>
          <div className="counter">{index + 1} / {media.length}</div>
        </>
      )}
    </div>
  );
};

// Sharing Prices Component
const SharingPrices = ({ pg }) => {
  const prices = [];
  
  if (pg.single_sharing && pg.single_sharing !== "0") {
    prices.push({ type: "Single Sharing", price: pg.single_sharing });
  }
  if (pg.double_sharing && pg.double_sharing !== "0") {
    prices.push({ type: "Double Sharing", price: pg.double_sharing });
  }
  if (pg.triple_sharing && pg.triple_sharing !== "0") {
    prices.push({ type: "Triple Sharing", price: pg.triple_sharing });
  }
  if (pg.four_sharing && pg.four_sharing !== "0") {
    prices.push({ type: "Four Sharing", price: pg.four_sharing });
  }
  if (pg.single_room && pg.single_room !== "0") {
    prices.push({ type: "Single Room", price: pg.single_room });
  }
  if (pg.double_room && pg.double_room !== "0") {
    prices.push({ type: "Double Room", price: pg.double_room });
  }

  if (prices.length === 0) return null;

  return (
    <div className="sharing-prices">
      <h3>Sharing Prices</h3>
      <div className="price-grid">
        {prices.map((p, i) => (
          <div key={i} className="price-card">
            <h4>{p.type}</h4>
            <p>₹{formatPrice(p.price)}/month</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Amenities Component
const Amenities = ({ pg }) => {
  const amenities = [
    pg.wifi_available && "📶 WiFi",
    pg.food_available && "🍽️ Food",
    pg.ac_available && "❄️ AC",
    pg.parking_available && "🚗 Parking",
    pg.cctv && "📹 CCTV",
    pg.laundry_available && "🧺 Laundry",
    pg.gym && "🏋️ Gym",
    pg.tv && "📺 TV",
    pg.geyser && "🚿 Geyser",
    pg.power_backup && "⚡ Power Backup",
    pg.lift_elevator && "⬆️ Lift",
    pg.housekeeping && "🧹 Housekeeping"
  ].filter(Boolean);

  if (amenities.length === 0) return null;

  return (
    <div className="amenities">
      <h3>Amenities</h3>
      <div className="amenities-grid">
        {amenities.map((amenity, i) => (
          <div key={i} className="amenity-item">{amenity}</div>
        ))}
      </div>
    </div>
  );
};

// Nearby Places Component
const NearbyPlaces = ({ pg }) => {
  const places = [
    pg.nearby_metro && `🚇 Metro - ${pg.nearby_metro}`,
    pg.nearby_bus_stop && `🚌 Bus Stop - ${pg.nearby_bus_stop}`,
    pg.nearby_hospital && `🏥 Hospital - ${pg.nearby_hospital}`,
    pg.nearby_school && `📚 School - ${pg.nearby_school}`,
    pg.nearby_college && `🏫 College - ${pg.nearby_college}`,
    pg.nearby_mall && `🛍️ Mall - ${pg.nearby_mall}`,
    pg.nearby_supermarket && `🛒 Supermarket - ${pg.nearby_supermarket}`,
    pg.nearby_restaurant && `🍽️ Restaurant - ${pg.nearby_restaurant}`,
    pg.nearby_bank && `🏦 Bank - ${pg.nearby_bank}`,
    pg.nearby_park && `🌳 Park - ${pg.nearby_park}`,
    pg.nearby_gym && `🏋️ Gym - ${pg.nearby_gym}`
  ].filter(Boolean);

  if (places.length === 0) return null;

  return (
    <div className="nearby-places">
      <h3>Nearby Places</h3>
      <div className="nearby-list">
        {places.map((place, i) => (
          <div key={i} className="nearby-item">{place}</div>
        ))}
      </div>
    </div>
  );
};

// Map Component
const Map = ({ pg }) => {
  if (!pg.latitude || !pg.longitude) return null;

  return (
    <div className="map-section">
      <h3>Location Map</h3>
      <MapContainer
        center={[pg.latitude, pg.longitude]}
        zoom={15}
        style={{ height: "300px", width: "100%", borderRadius: "14px" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[pg.latitude, pg.longitude]}>
          <Popup>{pg.pg_name}</Popup>
        </Marker>
      </MapContainer>
      <div className="address-details">
        <p>📍 {pg.address || `${pg.area}, ${pg.city}`}</p>
        {pg.landmark && <p>📍 Near {pg.landmark}</p>}
      </div>
    </div>
  );
};

// Nearby Properties Component
const NearbyProperties = ({ nearbyPGs, onViewPG }) => {
  if (!nearbyPGs || nearbyPGs.length === 0) return null;

  return (
    <div className="nearby-properties">
      <h3>Nearby Properties</h3>
      <div className="nearby-grid">
        {nearbyPGs.slice(0, 3).map((prop, i) => (
          <div key={i} className="nearby-card" onClick={() => onViewPG(prop.id)}>
            <div className="nearby-image">
              {prop.photos && prop.photos[0] ? (
                <img src={getCorrectImageUrl(prop.photos[0])} alt={prop.pg_name} />
              ) : (
                <div className="image-placeholder">🏠</div>
              )}
            </div>
            <h4>{prop.pg_name}</h4>
            <p className="nearby-price">₹{formatPrice(getStartingPrice(prop))}/month</p>
            <button className="view-btn">View Property</button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper to get starting price
const getStartingPrice = (pg) => {
  if (!pg) return null;
  
  const prices = [
    pg.single_sharing, pg.double_sharing, pg.triple_sharing, 
    pg.four_sharing, pg.single_room, pg.double_room
  ];
  
  const validPrice = prices.find(p => p && p !== "0" && Number(p) > 0);
  return validPrice || null;
};

// Calculate distance between coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Main Component
export default function PGDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [pg, setPG] = useState(null);
  const [media, setMedia] = useState([]);
  const [nearbyPGs, setNearbyPGs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch PG Details
  useEffect(() => {
    const fetchPGDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/pg/${id}`);
        
        if (!res.data?.success) {
          throw new Error(res.data?.message || "Failed to fetch property details");
        }

        const data = res.data.data;
        
        // Process media
        const photos = Array.isArray(data.photos)
          ? data.photos.map(p => ({ type: "photo", src: getCorrectImageUrl(p) }))
          : [];
        
        let videos = [];
        if (data.videos && typeof data.videos === "string") {
          try {
            const parsed = JSON.parse(data.videos);
            if (Array.isArray(parsed)) {
              videos = parsed.map(v => ({ type: "video", src: getCorrectImageUrl(v) }));
            }
          } catch (err) {
            console.error("Invalid video JSON:", err);
          }
        }
        
        setMedia([...photos, ...videos]);
        setPG(data);
      } catch (err) {
        console.error("Error fetching PG details:", err);
        setError(err.message || "Failed to load property details");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPGDetails();
  }, [id]);

  // Fetch Nearby Properties
  useEffect(() => {
    if (!pg?.latitude || !pg?.longitude) return;

    const fetchNearbyPGs = async () => {
      try {
        const res = await api.get(`/pg/nearby/${pg.latitude}/${pg.longitude}?radius=5&exclude=${id}`);
        
        if (res.data?.success && res.data?.data) {
          let pgsList = Array.isArray(res.data.data) ? res.data.data : [];
          
          const pgsWithDistance = pgsList
            .filter(otherPG => otherPG.id !== parseInt(id))
            .map(otherPG => {
              let distance = 0;
              if (otherPG.latitude && otherPG.longitude) {
                distance = calculateDistance(pg.latitude, pg.longitude, otherPG.latitude, otherPG.longitude);
              }
              return { ...otherPG, distance };
            });
          
          const sortedPGs = pgsWithDistance.sort((a, b) => a.distance - b.distance).slice(0, 4);
          setNearbyPGs(sortedPGs);
        }
      } catch (err) {
        console.error("Error fetching nearby PGs:", err);
      }
    };

    fetchNearbyPGs();
  }, [pg, id]);

  const handleCallOwner = () => {
    if (pg?.contact_phone) {
      window.location.href = `tel:${pg.contact_phone}`;
    }
  };

  const handleViewProperty = (pgId) => {
    navigate(`/pg/${pgId}`);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading property details...</p>
      </div>
    );
  }

  if (error || !pg) {
    return (
      <div className="error-container">
        <h2>Property Not Found</h2>
        <p>{error || "The property you're looking for doesn't exist."}</p>
        <button onClick={() => navigate("/")}>Back to Home</button>
      </div>
    );
  }

  const startingPrice = getStartingPrice(pg);
  const bedsLeft = pg.available_rooms || pg.total_rooms;

  return (
    <div className="pg-details-page">
      <ImageSlider media={media} />
      
      <div className="top-info">
        <h1>{pg.pg_name}</h1>
        <p className="location">📍 {pg.area || pg.city}, Bangalore</p>
        <div className="price-row">
          <h2>Starting ₹{formatPrice(startingPrice)}/month</h2>
          {bedsLeft > 0 && <span className="beds-left">⭐ {bedsLeft} Beds Left</span>}
        </div>
        <button className="call-btn" onClick={handleCallOwner}>
          📞 Call Owner
        </button>
      </div>

      <SharingPrices pg={pg} />
      <Amenities pg={pg} />
      <NearbyPlaces pg={pg} />
      <Map pg={pg} />
      <NearbyProperties nearbyPGs={nearbyPGs} onViewPG={handleViewProperty} />

      <style>{`
        .pg-details-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background: #f5f5f5;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* Image Slider */
        .slider {
          position: relative;
          background: white;
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 20px;
          border: 1px solid #eee;
        }
        .slider img, .slider video {
          width: 100%;
          height: 400px;
          object-fit: cover;
          display: block;
        }
        .nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255,255,255,0.9);
          border: 1px solid #ddd;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 18px;
        }
        .nav-btn.left { left: 20px; }
        .nav-btn.right { right: 20px; }
        .counter {
          position: absolute;
          bottom: 20px;
          right: 20px;
          background: rgba(0,0,0,0.7);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
        }
        .no-media {
          background: white;
          border-radius: 14px;
          padding: 80px;
          text-align: center;
          border: 1px solid #eee;
          margin-bottom: 20px;
        }
        .no-media span { font-size: 48px; display: block; margin-bottom: 10px; }

        /* Top Info */
        .top-info {
          background: white;
          border-radius: 14px;
          padding: 24px;
          margin-bottom: 20px;
          border: 1px solid #eee;
        }
        .top-info h1 {
          margin: 0 0 8px 0;
          font-size: 28px;
          color: #1a1a1a;
        }
        .location {
          color: #666;
          margin: 0 0 12px 0;
          font-size: 15px;
        }
        .price-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .top-info h2 {
          margin: 0;
          font-size: 24px;
          color: #22c55e;
        }
        .beds-left {
          background: #fef3c7;
          color: #d97706;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
        }
        .call-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          width: 100%;
        }
        .call-btn:hover { background: #2563eb; }

        /* Sharing Prices */
        .sharing-prices {
          background: white;
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 20px;
          border: 1px solid #eee;
        }
        .sharing-prices h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
        }
        .price-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
        }
        .price-card {
          background: #f9fafb;
          padding: 16px;
          border-radius: 12px;
          text-align: center;
          border: 1px solid #e5e7eb;
        }
        .price-card h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #666;
        }
        .price-card p {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #22c55e;
        }

        /* Amenities */
        .amenities {
          background: white;
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 20px;
          border: 1px solid #eee;
        }
        .amenities h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
        }
        .amenities-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 12px;
        }
        .amenity-item {
          background: #f9fafb;
          padding: 10px;
          border-radius: 10px;
          text-align: center;
          font-size: 14px;
          border: 1px solid #e5e7eb;
        }

        /* Nearby Places */
        .nearby-places {
          background: white;
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 20px;
          border: 1px solid #eee;
        }
        .nearby-places h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
        }
        .nearby-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .nearby-item {
          padding: 10px;
          background: #f9fafb;
          border-radius: 10px;
          font-size: 14px;
          border: 1px solid #e5e7eb;
        }

        /* Map */
        .map-section {
          background: white;
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 20px;
          border: 1px solid #eee;
        }
        .map-section h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
        }
        .address-details {
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid #eee;
        }
        .address-details p {
          margin: 8px 0;
          font-size: 14px;
          color: #666;
        }

        /* Nearby Properties */
        .nearby-properties {
          background: white;
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 20px;
          border: 1px solid #eee;
        }
        .nearby-properties h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
        }
        .nearby-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .nearby-card {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .nearby-card:hover { transform: translateY(-2px); }
        .nearby-image {
          height: 160px;
          background: #f3f4f6;
          overflow: hidden;
        }
        .nearby-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          background: #e5e7eb;
        }
        .nearby-card h4 {
          margin: 12px;
          font-size: 16px;
        }
        .nearby-price {
          margin: 0 12px 12px 12px;
          font-size: 18px;
          font-weight: 600;
          color: #22c55e;
        }
        .view-btn {
          margin: 0 12px 12px 12px;
          width: calc(100% - 24px);
          padding: 10px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
        }
        .view-btn:hover { background: #2563eb; }

        /* Loading & Error */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .error-container {
          text-align: center;
          padding: 60px 20px;
        }
        .error-container button {
          margin-top: 20px;
          padding: 10px 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .pg-details-page { padding: 12px; }
          .slider img, .slider video { height: 250px; }
          .top-info h1 { font-size: 22px; }
          .top-info h2 { font-size: 20px; }
          .price-grid { grid-template-columns: 1fr; }
          .amenities-grid { grid-template-columns: repeat(2, 1fr); }
          .nearby-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}