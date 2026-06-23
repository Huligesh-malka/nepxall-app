import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function Home() {
  const navigate = useNavigate();
  const [pgs, setPgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  // ✅ DSA: Search state
  const [search, setSearch] = useState("");
  const [searchDebounce, setSearchDebounce] = useState("");
  
  // ✅ DSA: Sort state
  const [sortBy, setSortBy] = useState("relevance");
  
  // ✅ DSA: Filter states
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  
  // ✅ DSA: User location for nearby
  const [userLocation, setUserLocation] = useState({ lat: null, lng: null });
  const [locationLoading, setLocationLoading] = useState(false);
  
  const limit = 12; // ✅ DSA: Better pagination limit
  
  // ✅ DSA: Debounced search effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchDebounce(search);
      setPage(1); // Reset page on search
    }, 500);
    
    return () => clearTimeout(handler);
  }, [search]);
  
  // ✅ DSA: Get user location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.log("Geolocation not supported");
      return;
    }
    
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationLoading(false);
      },
      (error) => {
        console.log("Location error:", error);
        setLocationLoading(false);
      }
    );
  }, []);
  
  // ✅ DSA: Fetch PGs with all algorithms
  const fetchPGs = useCallback(async (reset = false) => {
    const currentPage = reset ? 1 : page;
    
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      // Build query params with DSA features
      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("limit", limit);
      params.append("sort_by", sortBy);
      
      if (searchDebounce) {
        params.append("search", searchDebounce);
      }
      
      if (userLocation.lat && userLocation.lng && sortBy === "nearest") {
        params.append("lat", userLocation.lat);
        params.append("lng", userLocation.lng);
      }
      
      const response = await api.get(`/pg/search/advanced?${params.toString()}`);
      
      if (response.data?.data) {
        if (reset) {
          setPgs(response.data.data);
        } else {
          setPgs(prev => [...prev, ...response.data.data]);
        }
        
        setTotalCount(response.data.total || 0);
        
        // ✅ DSA: Check if more data exists (FIXED)
        setHasMore(response.data.hasMore === true);
      }
    } catch (error) {
      console.error("Error fetching PGs:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page, sortBy, searchDebounce, userLocation]);
  
  // ✅ DSA: Initial load and when dependencies change
  useEffect(() => {
    fetchPGs(true);
  }, [sortBy, searchDebounce, userLocation.lat, userLocation.lng]);
  
  // ✅ DSA: Page change effect
  useEffect(() => {
    if (page > 1) {
      fetchPGs(false);
    }
  }, [page]);
  
  // ✅ DSA: Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [sortBy, searchDebounce]);
  
  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setPage(prev => prev + 1);
    }
  };
  
  // ✅ DSA: Sort options
  const sortOptions = [
    { value: "relevance", label: "Relevance (Recommended)" },
    { value: "price_low", label: "Price: Low to High" },
    { value: "price_high", label: "Price: High to Low" },
    { value: "newest", label: "Newest First" },
    { value: "views", label: "Most Viewed" },
    { value: "nearest", label: "Nearest to Me" }
  ];
  
  // ✅ DSA: Available amenities for filtering
  const amenitiesList = [
    { key: "wifi_available", label: "WiFi" },
    { key: "ac_available", label: "AC" },
    { key: "food_available", label: "Food Available" },
    { key: "parking_available", label: "Parking" },
    { key: "gym", label: "Gym" },
    { key: "laundry_available", label: "Laundry" },
    { key: "cctv", label: "CCTV" },
    { key: "housekeeping", label: "Housekeeping" }
  ];
  
  // ✅ DSA: Toggle amenity filter
  const toggleAmenity = (amenity) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
    setPage(1);
  };
  
  // ✅ DSA: Apply price and amenity filters (frontend)
  const getFilteredPGs = () => {
    let filtered = [...pgs];
    
    // Price filter
    if (minPrice) {
      filtered = filtered.filter(pg => pg.rent_amount >= parseInt(minPrice));
    }
    if (maxPrice) {
      filtered = filtered.filter(pg => pg.rent_amount <= parseInt(maxPrice));
    }
    
    // Amenities filter
    if (selectedAmenities.length > 0) {
      filtered = filtered.filter(pg => {
        return selectedAmenities.every(amenity => pg[amenity] === true);
      });
    }
    
    // ✅ DSA: Additional frontend sorting if needed
    if (sortBy === "recommended") {
      filtered.sort((a, b) => (b.score || 0) - (a.score || 0));
    }
    
    return filtered;
  };
  
  const filteredPGs = getFilteredPGs();
  
  if (loading && page === 1) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <div style={{ fontSize: 18, color: "#666" }}>
          Loading properties...
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* ✅ SEO IMPROVED: Main H1 with target keywords */}
      <h1 style={{ marginBottom: "8px", fontSize: "28px" }}>
        Nepxall - Find Verified PGs, Coliving & Rental Homes in Bangalore
      </h1>
      
      {/* ✅ SEO IMPROVED: H2 with supporting description */}
      <h2
        style={{
          fontSize: "18px",
          color: "#666",
          marginBottom: "20px",
          fontWeight: "400"
        }}
      >
        Search verified PGs, Coliving spaces and rental homes directly from owners.
      </h2>
      
      {/* ✅ DSA: Search Bar */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="🔍 Search by PG name, city, or area..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 16px",
            fontSize: "16px",
            borderRadius: "12px",
            border: "1px solid #ddd",
            outline: "none",
            transition: "all 0.3s ease"
          }}
          onFocus={(e) => e.target.style.borderColor = "#2563eb"}
          onBlur={(e) => e.target.style.borderColor = "#ddd"}
        />
      </div>
      
      {/* ✅ DSA: Filters Row */}
      <div style={{ 
        display: "flex", 
        flexWrap: "wrap", 
        gap: "15px", 
        marginBottom: "20px",
        alignItems: "center"
      }}>
        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: "10px 15px",
            borderRadius: "8px",
            border: "1px solid #ddd",
            fontSize: "14px",
            cursor: "pointer",
            backgroundColor: "white"
          }}
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Location button */}
        <button
          onClick={getUserLocation}
          disabled={locationLoading}
          style={{
            padding: "10px 15px",
            borderRadius: "8px",
            border: "1px solid #ddd",
            backgroundColor: userLocation.lat ? "#2563eb" : "white",
            color: userLocation.lat ? "white" : "#333",
            cursor: "pointer",
            transition: "all 0.3s ease"
          }}
        >
          {locationLoading ? "📍 Getting location..." : userLocation.lat ? "📍 Location set" : "📍 Get my location"}
        </button>
        
        {/* Price filters */}
        <input
          type="number"
          placeholder="Min Price"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          style={{
            padding: "10px 15px",
            borderRadius: "8px",
            border: "1px solid #ddd",
            width: "110px",
            fontSize: "14px"
          }}
        />
        <input
          type="number"
          placeholder="Max Price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          style={{
            padding: "10px 15px",
            borderRadius: "8px",
            border: "1px solid #ddd",
            width: "110px",
            fontSize: "14px"
          }}
        />
      </div>
      
      {/* ✅ DSA: Amenities Filter Chips */}
      <div style={{ 
        display: "flex", 
        flexWrap: "wrap", 
        gap: "10px", 
        marginBottom: "20px" 
      }}>
        {amenitiesList.map(amenity => (
          <button
            key={amenity.key}
            onClick={() => toggleAmenity(amenity.key)}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: selectedAmenities.includes(amenity.key) ? "none" : "1px solid #ddd",
              backgroundColor: selectedAmenities.includes(amenity.key) ? "#2563eb" : "white",
              color: selectedAmenities.includes(amenity.key) ? "white" : "#333",
              cursor: "pointer",
              fontSize: "13px",
              transition: "all 0.2s ease"
            }}
          >
            {amenity.label}
          </button>
        ))}
      </div>
      
      {/* Results count */}
      <div style={{ marginBottom: "20px", color: "#666", fontSize: "14px" }}>
        Showing {filteredPGs.length} of {totalCount} properties
      </div>
      
      {/* ✅ DSA: Property Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", 
        gap: "24px" 
      }}>
        {filteredPGs.map(pg => (
          <div 
            key={pg.id} 
            onClick={() => navigate(`/pg/${pg.id}`)}
            style={{ 
              border: "1px solid #e0e0e0", 
              borderRadius: "16px",
              overflow: "hidden",
              cursor: "pointer",
              transition: "all 0.3s ease",
              backgroundColor: "white",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
            }}
          >
            {/* Image placeholder */}
            <div style={{
              height: "200px",
              backgroundColor: "#f0f0f0",
              backgroundImage: pg.photos?.[0] ? `url(${pg.photos[0]})` : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
              position: "relative"
            }}>
              {pg.is_featured && (
                <span style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  backgroundColor: "#f59e0b",
                  color: "white",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "bold"
                }}>
                  Featured
                </span>
              )}
              {pg.distance && (
                <span style={{
                  position: "absolute",
                  bottom: "12px",
                  left: "12px",
                  backgroundColor: "rgba(0,0,0,0.7)",
                  color: "white",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  fontSize: "12px"
                }}>
                  📍 {pg.distance} km away
                </span>
              )}
            </div>
            
            <div style={{ padding: "16px" }}>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>
                {pg.pg_name}
              </h3>
              <p style={{ margin: "0 0 8px 0", color: "#666", fontSize: "14px" }}>
                📍 {pg.location || pg.area || pg.city}
              </p>
              <p style={{ 
                margin: "8px 0", 
                fontSize: "22px", 
                fontWeight: "bold", 
                color: "#2563eb" 
              }}>
                ₹{pg.rent_amount?.toLocaleString()}
                <span style={{ fontSize: "14px", fontWeight: "normal", color: "#666" }}>
                  /month
                </span>
              </p>
              
              {/* Amenities badges */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "12px" }}>
                {pg.wifi_available && <span style={{ fontSize: "12px", color: "#666" }}>📶 WiFi</span>}
                {pg.ac_available && <span style={{ fontSize: "12px", color: "#666" }}>❄️ AC</span>}
                {pg.food_available && <span style={{ fontSize: "12px", color: "#666" }}>🍽️ Food</span>}
                {pg.parking_available && <span style={{ fontSize: "12px", color: "#666" }}>🅿️ Parking</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* ✅ DSA: Load More Button with Pagination */}
      {hasMore && filteredPGs.length > 0 && (
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          marginTop: "40px" 
        }}>
          <button
            onClick={loadMore}
            disabled={loadingMore}
            style={{
              padding: "12px 32px",
              border: "none",
              borderRadius: "40px",
              background: "#2563eb",
              color: "white",
              cursor: loadingMore ? "not-allowed" : "pointer",
              fontSize: "16px",
              fontWeight: "500",
              transition: "all 0.3s ease",
              opacity: loadingMore ? 0.7 : 1
            }}
            onMouseEnter={(e) => !loadingMore && (e.currentTarget.style.background = "#1d4ed8")}
            onMouseLeave={(e) => !loadingMore && (e.currentTarget.style.background = "#2563eb")}
          >
            {loadingMore ? "Loading..." : "Load More Properties"}
          </button>
        </div>
      )}
      
      {/* No results message */}
      {filteredPGs.length === 0 && !loading && (
        <div style={{ 
          textAlign: "center", 
          padding: "60px 20px",
          color: "#666"
        }}>
          <p style={{ fontSize: "18px" }}>No properties found</p>
          <p style={{ fontSize: "14px" }}>Try adjusting your search or filters</p>
        </div>
      )}
      
      {/* Total count footer */}
      {filteredPGs.length > 0 && (
        <div style={{ textAlign: "center", marginTop: "30px", marginBottom: "20px" }}>
          <p style={{ fontSize: "14px", color: "#666" }}>
            Showing {filteredPGs.length} of {totalCount} properties
          </p>
        </div>
      )}
    </div>
  );
}