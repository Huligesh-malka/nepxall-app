import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api/api";
import { auth } from "../firebase";



const BACKEND_URL = "http://localhost:5000";
const PG_API = `${BACKEND_URL}/api/pg`;

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
const Section = ({ title, children, hasContent = true, badgeCount }) => 
  hasContent ? (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>{title}</h3>
        {badgeCount !== undefined && badgeCount > 0 && (
          <span style={styles.sectionBadge}>{badgeCount}</span>
        )}
      </div>
      {children}
    </div>
  ) : null;

const FacilityItem = ({ icon, label, active = true, onClick, categoryColor }) => (
  <div 
    style={{
      ...styles.facilityItem,
      background: active 
        ? `linear-gradient(135deg, ${categoryColor || '#f0f9ff'}, white)` 
        : '#f9fafb',
      borderLeft: `4px solid ${categoryColor || '#667eea'}`,
      ...(active ? styles.facilityItemActive : styles.facilityItemInactive)
    }}
    onClick={onClick}
    title={label}
  >
    <span style={styles.facilityIcon}>{icon}</span>
    <span style={styles.facilityLabel}>{label}</span>
    {active && <span style={styles.checkmark}>✓</span>}
  </div>
);

const RuleItem = ({ icon, label, allowed, description }) => (
  <div style={{
    ...styles.ruleItem,
    background: allowed 
      ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' 
      : 'linear-gradient(135deg, #fef2f2, #fee2e2)'
  }}>
    <div style={styles.ruleIconContainer}>
      <span style={{
        ...styles.ruleIcon,
        background: allowed ? '#10b981' : '#ef4444'
      }}>{icon}</span>
    </div>
    <div style={styles.ruleContent}>
      <div style={{
        ...styles.ruleLabel,
        color: allowed ? '#065f46' : '#7f1d1d'
      }}>{label}</div>
      {description && (
        <div style={styles.ruleDescription}>{description}</div>
      )}
      <div style={styles.ruleStatus}>
        <span style={{
          ...styles.ruleStatusBadge,
          background: allowed ? '#10b981' : '#ef4444'
        }}>
          {allowed ? '✅ Allowed' : '❌ Not Allowed'}
        </span>
      </div>
    </div>
  </div>
);

const InfoRow = ({ label, value }) => {
  if (!value || value === "false" || value === false || value === "") return null;
  return (
    <div style={styles.infoRow}>
      <strong>{label}:</strong> {value}
    </div>
  );
};

// Price Component for different property types
const PriceDetails = ({ pg }) => {
  const isToLet = pg?.pg_category === "to_let";
  const isCoLiving = pg?.pg_category === "coliving";
  const isPG = !isToLet && !isCoLiving;

  const formatPrice = (price) => {
    if (!price || price === "" || price === "0") return "—";
    return `₹${parseInt(price).toLocaleString('en-IN')}`;
  };

  // Check if any price exists
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
      <div style={styles.noPriceContainer}>
        <span style={styles.noPriceIcon}>💰</span>
        <p style={styles.noPriceText}>Price details not available</p>
      </div>
    );
  }

  return (
    <div style={styles.priceDetailsContainer}>
      {/* TO LET Prices */}
      {isToLet && (
        <div style={styles.priceSection}>
          <h4 style={styles.priceSectionTitle}>
            <span style={styles.priceSectionIcon}>🏠</span>
            House/Flat Rental Prices
          </h4>
          <div style={styles.priceGrid}>
            {pg.price_1bhk && pg.price_1bhk !== "0" && pg.price_1bhk !== "" && (
              <div style={styles.priceItem}>
                <div style={styles.priceType}>1 BHK</div>
                <div style={styles.priceValue}>
                  {formatPrice(pg.price_1bhk)}/month
                </div>
                {pg.security_deposit_1bhk && pg.security_deposit_1bhk !== "0" && pg.security_deposit_1bhk !== "" && (
                  <div style={styles.depositAmount}>
                    Security: {formatPrice(pg.security_deposit_1bhk)}
                  </div>
                )}
              </div>
            )}
            {pg.price_2bhk && pg.price_2bhk !== "0" && pg.price_2bhk !== "" && (
              <div style={styles.priceItem}>
                <div style={styles.priceType}>2 BHK</div>
                <div style={styles.priceValue}>
                  {formatPrice(pg.price_2bhk)}/month
                </div>
                {pg.security_deposit_2bhk && pg.security_deposit_2bhk !== "0" && pg.security_deposit_2bhk !== "" && (
                  <div style={styles.depositAmount}>
                    Security: {formatPrice(pg.security_deposit_2bhk)}
                  </div>
                )}
              </div>
            )}
            {pg.price_3bhk && pg.price_3bhk !== "0" && pg.price_3bhk !== "" && (
              <div style={styles.priceItem}>
                <div style={styles.priceType}>3 BHK</div>
                <div style={styles.priceValue}>
                  {formatPrice(pg.price_3bhk)}/month
                </div>
                {pg.security_deposit_3bhk && pg.security_deposit_3bhk !== "0" && pg.security_deposit_3bhk !== "" && (
                  <div style={styles.depositAmount}>
                    Security: {formatPrice(pg.security_deposit_3bhk)}
                  </div>
                )}
              </div>
            )}
            {pg.price_4bhk && pg.price_4bhk !== "0" && pg.price_4bhk !== "" && (
              <div style={styles.priceItem}>
                <div style={styles.priceType}>4 BHK</div>
                <div style={styles.priceValue}>
                  {formatPrice(pg.price_4bhk)}/month
                </div>
                {pg.security_deposit_4bhk && pg.security_deposit_4bhk !== "0" && pg.security_deposit_4bhk !== "" && (
                  <div style={styles.depositAmount}>
                    Security: {formatPrice(pg.security_deposit_4bhk)}
                  </div>
                )}
              </div>
            )}
          </div>
          {pg.bhk_type && (
            <div style={styles.bhkInfo}>
              Available: {pg.bhk_type === "4+" ? "4+ BHK" : `${pg.bhk_type} BHK`}
            </div>
          )}
        </div>
      )}

      {/* CO-LIVING Prices */}
      {isCoLiving && (
        <div style={styles.priceSection}>
          <h4 style={styles.priceSectionTitle}>
            <span style={styles.priceSectionIcon}>🤝</span>
            Co-Living Prices
          </h4>
          <div style={styles.priceGrid}>
            {pg.co_living_single_room && pg.co_living_single_room !== "0" && pg.co_living_single_room !== "" && (
              <div style={styles.priceItem}>
                <div style={styles.priceType}>Single Room</div>
                <div style={styles.priceValue}>
                  {formatPrice(pg.co_living_single_room)}/month
                </div>
                {pg.co_living_security_deposit && pg.co_living_security_deposit !== "0" && pg.co_living_security_deposit !== "" && (
                  <div style={styles.depositAmount}>
                    Security: {formatPrice(pg.co_living_security_deposit)}
                  </div>
                )}
              </div>
            )}
            {pg.co_living_double_room && pg.co_living_double_room !== "0" && pg.co_living_double_room !== "" && (
              <div style={styles.priceItem}>
                <div style={styles.priceType}>Double Room</div>
                <div style={styles.priceValue}>
                  {formatPrice(pg.co_living_double_room)}/month
                </div>
                {pg.co_living_security_deposit && pg.co_living_security_deposit !== "0" && pg.co_living_security_deposit !== "" && (
                  <div style={styles.depositAmount}>
                    Security: {formatPrice(pg.co_living_security_deposit)}
                  </div>
                )}
              </div>
            )}
          </div>
          {pg.co_living_includes && (
            <div style={styles.includesInfo}>
              Includes: {pg.co_living_includes}
            </div>
          )}
        </div>
      )}

      {/* PG/HOSTEL Prices */}
      {isPG && (
        <div style={styles.priceSection}>
          <h4 style={styles.priceSectionTitle}>
            <span style={styles.priceSectionIcon}>🏢</span>
            PG/Hostel Room Prices
          </h4>
          
          {/* Sharing Rooms */}
          {(pg.single_sharing || pg.double_sharing || pg.triple_sharing || pg.four_sharing) && (
            <div style={styles.priceCategory}>
              <div style={styles.priceCategoryTitle}>Sharing Rooms</div>
              <div style={styles.priceGrid}>
                {pg.single_sharing && pg.single_sharing !== "0" && pg.single_sharing !== "" && (
                  <div style={styles.priceItem}>
                    <div style={styles.priceType}>Single Sharing</div>
                    <div style={styles.priceValue}>
                      {formatPrice(pg.single_sharing)}/month
                    </div>
                  </div>
                )}
                {pg.double_sharing && pg.double_sharing !== "0" && pg.double_sharing !== "" && (
                  <div style={styles.priceItem}>
                    <div style={styles.priceType}>Double Sharing</div>
                    <div style={styles.priceValue}>
                      {formatPrice(pg.double_sharing)}/month
                    </div>
                  </div>
                )}
                {pg.triple_sharing && pg.triple_sharing !== "0" && pg.triple_sharing !== "" && (
                  <div style={styles.priceItem}>
                    <div style={styles.priceType}>Triple Sharing</div>
                    <div style={styles.priceValue}>
                      {formatPrice(pg.triple_sharing)}/month
                    </div>
                  </div>
                )}
                {pg.four_sharing && pg.four_sharing !== "0" && pg.four_sharing !== "" && (
                  <div style={styles.priceItem}>
                    <div style={styles.priceType}>Four Sharing</div>
                    <div style={styles.priceValue}>
                      {formatPrice(pg.four_sharing)}/month
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Private Rooms */}
          {(pg.single_room || pg.double_room || pg.triple_room) && (
            <div style={styles.priceCategory}>
              <div style={styles.priceCategoryTitle}>Private Rooms</div>
              <div style={styles.priceGrid}>
                {pg.single_room && pg.single_room !== "0" && pg.single_room !== "" && (
                  <div style={styles.priceItem}>
                    <div style={styles.priceType}>Single Room</div>
                    <div style={styles.priceValue}>
                      {formatPrice(pg.single_room)}/month
                    </div>
                  </div>
                )}
                {pg.double_room && pg.double_room !== "0" && pg.double_room !== "" && (
                  <div style={styles.priceItem}>
                    <div style={styles.priceType}>Double Room</div>
                    <div style={styles.priceValue}>
                      {formatPrice(pg.double_room)}/month
                    </div>
                  </div>
                )}
                {pg.triple_room && pg.triple_room !== "0" && pg.triple_room !== "" && (
                  <div style={styles.priceItem}>
                    <div style={styles.priceType}>Triple Room</div>
                    <div style={styles.priceValue}>
                      {formatPrice(pg.triple_room)}/month
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Charges */}
          {(pg.security_deposit || pg.maintenance_charges || pg.advance_rent) && (
            <div style={styles.additionalCharges}>
              <h5 style={styles.additionalChargesTitle}>Additional Charges</h5>
              <div style={styles.chargesGrid}>
                {pg.security_deposit && pg.security_deposit !== "0" && pg.security_deposit !== "" && (
                  <div style={styles.chargeItem}>
                    <span style={styles.chargeLabel}>Security Deposit:</span>
                    <span style={styles.chargeValue}>{formatPrice(pg.security_deposit)}</span>
                  </div>
                )}
                {pg.maintenance_charges && pg.maintenance_charges !== "0" && pg.maintenance_charges !== "" && (
                  <div style={styles.chargeItem}>
                    <span style={styles.chargeLabel}>Maintenance:</span>
                    <span style={styles.chargeValue}>{formatPrice(pg.maintenance_charges)}/month</span>
                  </div>
                )}
                {pg.advance_rent && pg.advance_rent !== "0" && pg.advance_rent !== "" && (
                  <div style={styles.chargeItem}>
                    <span style={styles.chargeLabel}>Advance Rent:</span>
                    <span style={styles.chargeValue}>{pg.advance_rent} months</span>
                  </div>
                )}
                {pg.lock_in_period && pg.lock_in_period !== "0" && pg.lock_in_period !== "" && (
                  <div style={styles.chargeItem}>
                    <span style={styles.chargeLabel}>Lock-in Period:</span>
                    <span style={styles.chargeValue}>{pg.lock_in_period} months</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Food Charges (if applicable) */}
      {pg.food_available && pg.food_charges && pg.food_charges !== "0" && pg.food_charges !== "" && (
        <div style={styles.foodCharges}>
          <span style={styles.foodChargesIcon}>🍽️</span>
          <div>
            <div style={styles.foodChargesLabel}>Food Charges (Optional)</div>
            <div style={styles.foodChargesValue}>{formatPrice(pg.food_charges)}/month</div>
          </div>
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
      ...styles.highlightCategoryBtn,
      background: isActive 
        ? `linear-gradient(135deg, ${color}, ${color}dd)` 
        : 'white',
      color: isActive ? 'white' : '#374151',
      boxShadow: isActive ? `0 4px 15px ${color}40` : '0 2px 10px rgba(0,0,0,0.05)',
      ...(count === 0 ? styles.highlightCategoryBtnEmpty : {})
    }}
    onClick={onClick}
    disabled={count === 0}
  >
    <span style={styles.highlightCategoryIcon}>{icon}</span>
    <span style={styles.highlightCategoryLabel}>
      {label} {count > 0 && <span style={styles.highlightCategoryCount}>{count}</span>}
    </span>
  </button>
);

// Highlight Item Component
const HighlightItem = ({ name, type, category, icon, onMapView, coordinates, color }) => (
  <div 
    style={{
      ...styles.highlightItem,
      borderLeft: `4px solid ${color}`
    }}
    onClick={onMapView}
  >
    <div style={{
      ...styles.highlightIconContainer,
      background: `linear-gradient(135deg, ${color}, ${color}dd)`
    }}>
      <span style={styles.highlightIcon}>{icon}</span>
    </div>
    <div style={styles.highlightContent}>
      <div style={styles.highlightName}>{name}</div>
      <div style={styles.highlightType}>{type.replace(/_/g, ' ').replace('nearby ', '')}</div>
      {coordinates && (
        <div style={styles.highlightDistance}>
          📏 {calculateDistance(coordinates).toFixed(1)} km away
        </div>
      )}
    </div>
    <button 
      style={{
        ...styles.viewOnMapButton,
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

// Nearby PG Card Component - UPDATED
const NearbyPGCard = ({ pg, onClick, distance }) => {
  // Get starting price
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

  return (
    <div style={styles.nearbyPgCard} onClick={onClick}>
      <div style={styles.nearbyPgImageContainer}>
        <div style={styles.nearbyPgImagePlaceholder}>
          {pg.photos && pg.photos.length > 0 ? (
            <img 
              src={`${BACKEND_URL}${pg.photos[0]}`} 
              alt={pg.pg_name} 
              style={styles.nearbyPgImage}
            />
          ) : (
            <div style={styles.nearbyPgNoImage}>🏠</div>
          )}
        </div>
        <div style={styles.nearbyPgBadges}>
          <span style={styles.nearbyPgTypeBadge}>
            {pg.pg_category === "to_let" ? "🏠 House" : 
             pg.pg_category === "coliving" ? "🤝 Co-Living" : 
             "🏢 PG"}
          </span>
          {distance && (
            <span style={styles.nearbyPgDistanceBadge}>
              📏 {distance.toFixed(1)} km
            </span>
          )}
        </div>
      </div>
      
      <div style={styles.nearbyPgContent}>
        <h4 style={styles.nearbyPgTitle}>{pg.pg_name}</h4>
        <p style={styles.nearbyPgAddress}>
          📍 {pg.address ? `${pg.address.substring(0, 40)}...` : pg.area || pg.city}
        </p>
        
        <div style={styles.nearbyPgStats}>
          <div style={styles.nearbyPgStat}>
            <span style={styles.nearbyPgStatIcon}>💰</span>
            <span style={styles.nearbyPgStatText}>
              ₹{getStartingPrice()}/month
            </span>
          </div>
          <div style={styles.nearbyPgStat}>
            <span style={styles.nearbyPgStatIcon}>🏠</span>
            <span style={styles.nearbyPgStatText}>
              {pg.available_rooms || pg.total_rooms || 0} rooms
            </span>
          </div>
        </div>
        
        <div style={styles.nearbyPgFacilities}>
          {pg.ac_available && <span style={styles.nearbyPgFacility}>❄️</span>}
          {pg.wifi_available && <span style={styles.nearbyPgFacility}>📶</span>}
          {pg.food_available && <span style={styles.nearbyPgFacility}>🍽️</span>}
          {pg.parking_available && <span style={styles.nearbyPgFacility}>🚗</span>}
          {pg.cctv && <span style={styles.nearbyPgFacility}>📹</span>}
          {pg.laundry_available && <span style={styles.nearbyPgFacility}>🧺</span>}
        </div>
        
        <button 
          style={styles.nearbyPgViewButton}
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


const showNotification = (message) => {
  alert(message);
};

// Helper function to calculate distance
const calculateDistance = (coordinates) => {
  return Math.random() * 2 + 0.5;
};

// Helper function to calculate distance between coordinates
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
      <div style={styles.loadingHighlightsPanel}>
        <div className="spinner"></div>
        <p>Finding nearby places...</p>
      </div>
    );
  }

  if (highlights.length === 0) {
    return (
      <div style={styles.noHighlightsPanel}>
        <div style={styles.noHighlightsIcon}>📍</div>
        <h4 style={styles.noHighlightsTitle}>No Nearby Places Found</h4>
        <p style={styles.noHighlightsText}>
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
    <div style={styles.highlightsPanel}>
      {/* Categories Pills */}
      <div style={styles.categoriesPills}>
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

      {/* Highlights List */}
      <div style={styles.highlightsList}>
        <div style={styles.highlightsListHeader}>
          <h4 style={styles.highlightsListTitle}>
            <span style={{
              ...styles.categoryIndicator,
              background: selectedColor
            }}></span>
            {selectedCategory === "all" 
              ? `All Nearby Places` 
              : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`
            }
          </h4>
          <span style={styles.highlightsCount}>{filteredHighlights.length} places</span>
        </div>
        
        <div style={styles.highlightsItemsContainer}>
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
    return (
      <div style={styles.noNearbyPGs}>
        <div style={styles.noNearbyPGsIcon}>🏠</div>
        <h4 style={styles.noNearbyPGsTitle}>No Nearby Properties</h4>
        <p style={styles.noNearbyPGsText}>
          We couldn't find other properties in this area.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.nearbyPGsPanel}>
      <div style={styles.nearbyPGsHeader}>
        <h3 style={styles.nearbyPGsTitle}>
          <span style={styles.nearbyPGsIcon}>🏘️</span>
          Nearby Properties
        </h3>
        <span style={styles.nearbyPGsCount}>{nearbyPGs.length} properties</span>
      </div>
      
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
      
      <div style={styles.nearbyPGsFooter}>
        <button style={styles.viewAllPropertiesButton}>
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

  const [pg, setPG] = useState(null);
  const [media, setMedia] = useState([]);
  const [index, setIndex] = useState(0);
  const [nearbyHighlights, setNearbyHighlights] = useState([]);
  const [nearbyPGs, setNearbyPGs] = useState([]);
  const [loadingHighlights, setLoadingHighlights] = useState(false);
  const [loadingNearbyPGs, setLoadingNearbyPGs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    name: "",
    email: "",
    phone: "",
    checkInDate: "",
    duration: "6",
    message: ""
  });

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

  useEffect(() => {
    const fetchPGDetails = async () => {
      try {
        setLoading(true);
        console.log("Fetching PG details for ID:", id);
        const res = await axios.get(`${PG_API}/${id}`);
        
        if (!res.data?.success) {
          console.error("Failed to fetch PG details");
          return;
        }

        const data = res.data.data;
        console.log("PG data received:", data.pg_name);

        const photos = Array.isArray(data.photos)
          ? data.photos.map(p => ({ type: "photo", src: BACKEND_URL + p }))
          : [];

        let videos = [];
        try {
          if (data.videos) {
            videos = JSON.parse(data.videos || "[]").map(v => ({
              type: "video",
              src: BACKEND_URL + v,
            }));
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
      } finally {
        setLoading(false);
      }
    };

    fetchPGDetails();
  }, [id]);

  useEffect(() => {
    if (!pg?.latitude || !pg?.longitude) return;

    // Process database highlights
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
    
    // Fetch auto-generated highlights
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

    // Fetch nearby PGs
    const fetchNearbyPGs = async () => {
      try {
        setLoadingNearbyPGs(true);
        console.log("Fetching nearby PGs for:", pg.latitude, pg.longitude);
        
        // Ensure id is valid
        if (!id || id === "undefined") {
          console.error("Invalid PG ID:", id);
          setNearbyPGs([]);
          return;
        }

        const response = await axios.get(
          `${PG_API}/nearby/${pg.latitude}/${pg.longitude}?radius=5&exclude=${id}`,
          { timeout: 10000 }
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

  // Property type helpers
  const isToLet = pg?.pg_category === "to_let";
  const isCoLiving = pg?.pg_category === "coliving";
  const isPG = !isToLet && !isCoLiving;
  const hasOwnerContact = pg?.contact_phone && pg.contact_phone.trim() !== "";
  const hasContactPerson = pg?.contact_person && pg.contact_person.trim() !== "";
  const hasLocation = pg?.latitude && pg?.longitude;

  // Helper function to get starting price
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
const handleBookNow = () => {
  const user = auth.currentUser;

  if (!user) {
    navigate("/register", {
      state: { redirectTo: `/pg/${id}` }
    });
    return;
  }

  setShowBookingModal(true);
};




 const handleBookingSubmit = async (bookingData) => {
  try {
    const user = auth.currentUser;

    if (!user) {
      showNotification("Please register or login to continue");
      navigate("/register");
      return;
    }

    const token = await user.getIdToken(true);

    const payload = {
      pg_id: id, // 👈 PG ID from params
      name: bookingData.name,
      phone: bookingData.phone,
      email: bookingData.email,
      check_in_date: bookingData.checkInDate,
      duration: bookingData.duration,
      message: bookingData.message
    };

    await api.post("/bookings", payload, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    showNotification("✅ Booking request sent to owner");
    setShowBookingModal(false);

  } catch (error) {
    console.error(error);
    showNotification("❌ Booking failed. Try again");
  }
};


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({ ...prev, [name]: value }));
  };

  const handleCallOwner = () => {
  if (hasOwnerContact) {
    window.location.href = `tel:${pg.contact_phone}`;
  } else {
    alert("Owner contact will be visible after booking approval");
  }
};


  // Handle view on map for a highlight
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

  // Handle view nearby PG
  const handleViewNearbyPG = (pgId) => {
    console.log("Navigating to PG:", pgId);
    if (pgId) {
      navigate(`/pg/${pgId}`);
      window.location.reload(); // Force refresh to load new PG data
    }
  };

  // Handle view all properties in area
  const handleViewAllProperties = () => {
    if (pg?.area) {
      navigate(`/properties?area=${encodeURIComponent(pg.area)}`);
    } else if (pg?.city) {
      navigate(`/properties?city=${encodeURIComponent(pg.city)}`);
    } else {
      navigate("/properties");
    }
  };

  // Toggle rules section
  const toggleRulesSection = (section) => {
    setExpandedRules(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Get ALL facilities
  const getAllFacilities = () => {
    return [
      // ROOM FURNISHINGS
      { key: "cupboard_available", label: "Cupboard/Wardrobe", icon: "👔", category: "room" },
      { key: "table_chair_available", label: "Study Table & Chair", icon: "💺", category: "room" },
      { key: "dining_table_available", label: "Dining Table", icon: "🍽️", category: "kitchen" },
      { key: "attached_bathroom", label: "Attached Bathroom", icon: "🚽", category: "room" },
      { key: "balcony_available", label: "Balcony", icon: "🌿", category: "room" },
      { key: "wall_mounted_clothes_hook", label: "Wall-Mounted Clothes Hook", icon: "🪝", category: "room" },
      { key: "bed_with_mattress", label: "Bed with Mattress", icon: "🛏️", category: "room" },
      { key: "fan_light", label: "Fan & Light", icon: "💡", category: "room" },
      { key: "kitchen_room", label: "Kitchen Room", icon: "🍳", category: "kitchen" },
      
      // OTHER FACILITIES
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

  // Get filtered facilities based on category - ONLY SHOW TRUE VALUES
  const getFilteredFacilities = () => {
    const allFacilities = getAllFacilities();
    
    // Filter to show only true facilities
    const trueFacilities = allFacilities.filter(facility => 
      pg && (pg[facility.key] === true || pg[facility.key] === "true")
    );

    if (selectedFacilityCategory === "all") {
      return trueFacilities;
    }
    
    return trueFacilities.filter(facility => facility.category === selectedFacilityCategory);
  };

  // Get count of true facilities in a category
  const getTrueFacilitiesCountInCategory = (categoryId) => {
    const allFacilities = getAllFacilities();
    if (categoryId === "all") {
      return allFacilities.filter(facility => 
        pg && (pg[facility.key] === true || pg[facility.key] === "true")
      ).length;
    }
    return allFacilities.filter(facility => 
      facility.category === categoryId && pg && (pg[facility.key] === true || pg[facility.key] === "true")
    ).length;
  };

  // Check if section has content
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

  // Check if has price details
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

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="spinner"></div>
        <p>Loading property details...</p>
      </div>
    );
  }

  if (!pg) {
    return (
      <div style={styles.errorContainer}>
        <h2>Property Not Found</h2>
        <p>The property you're looking for doesn't exist or has been removed.</p>
        <button style={styles.backButton} onClick={() => navigate("/")}>
          ← Back to Home
        </button>
      </div>
    );
  }

  const current = media[index];
  
  // Calculate available facilities count
  const availableFacilitiesCount = getTrueFacilitiesCountInCategory("all");
  const filteredFacilities = getFilteredFacilities();

  // Check if we should show sections
  const shouldShowNearbyHighlights = hasLocation && (nearbyHighlights.length > 0 || loadingHighlights);
  const shouldShowNearbyPGs = nearbyPGs.length > 0 || loadingNearbyPGs;

  return (
    <div style={styles.page}>
      {/* Breadcrumb */}
      <div style={styles.breadcrumb}>
        <span style={styles.breadcrumbLink} onClick={() => navigate("/")}>Home</span>
        <span style={styles.breadcrumbSeparator}>/</span>
        <span style={styles.breadcrumbLink} onClick={() => navigate("/properties")}>Properties</span>
        <span style={styles.breadcrumbSeparator}>/</span>
        <span style={styles.breadcrumbCurrent}>{pg.pg_name}</span>
      </div>

      {/* Media Slider */}
      {media.length > 0 ? (
        <div style={styles.slider}>
          {current.type === "photo" ? (
            <img src={current.src} alt={pg.pg_name} style={styles.media} />
          ) : (
            <video src={current.src} controls style={styles.media} />
          )}

          {media.length > 1 && (
            <>
              <button
                style={styles.navBtnLeft}
                onClick={() => setIndex(i => (i === 0 ? media.length - 1 : i - 1))}
              >
                ‹
              </button>
              <button
                style={styles.navBtnRight}
                onClick={() => setIndex(i => (i + 1) % media.length)}
              >
                ›
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

      {/* Main Property Info */}
      <div style={styles.mainCard}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>{pg.pg_name}</h1>
            <p style={styles.address}>📍 {pg.address}</p>
            {pg.landmark && <p style={styles.landmark}>🏷️ Near {pg.landmark}</p>}
          </div>
          <div style={styles.actionButtons}>
            <button
              style={styles.bookButton}
              onClick={() => handleBookNow()}
            >
              🏠 Book Now
            </button>
            {hasOwnerContact && (
              <button
                style={styles.callButton}
                onClick={handleCallOwner}
              >
                📞 Call Owner
              </button>
            )}
            {hasLocation && (
              <button
                style={styles.directionButton}
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${pg.latitude},${pg.longitude}`,
                    "_blank"
                  )
                }
              >
                🗺️ Get Directions
              </button>
            )}
          </div>
        </div>

        <div style={styles.badgeRow}>
          <span style={styles.typeBadge}>
            {isToLet ? "🏠 House/Flat" : 
             isCoLiving ? "🤝 Co-Living" : 
             "🏢 PG/Hostel"}
          </span>
          
          {!isToLet && !isCoLiving && pg.pg_type && (
            <span style={styles.genderBadge}>
              {pg.pg_type === "boys" ? "👨 Boys Only" : 
               pg.pg_type === "girls" ? "👩 Girls Only" : 
               pg.pg_type === "coliving" ? "🤝 Co-Living" : "Mixed"}
            </span>
          )}
          
          {isToLet && pg.bhk_type && (
            <span style={styles.bhkBadge}>
              {pg.bhk_type === "4+" ? "4+ BHK" : `${pg.bhk_type} BHK`}
            </span>
          )}
          
          {isToLet && pg.furnishing_type && (
            <span style={styles.furnishingBadge}>
              {pg.furnishing_type === "fully_furnished" ? "🛋️ Fully Furnished" :
               pg.furnishing_type === "semi_furnished" ? "🛋️ Semi-Furnished" :
               "🛋️ Unfurnished"}
            </span>
          )}
          
          <span style={{
            ...styles.availabilityBadge,
            backgroundColor: pg.available_rooms > 0 ? "#10b981" : "#ef4444"
          }}>
            {pg.available_rooms > 0 ? `🟢 ${pg.available_rooms} Available` : "🔴 Fully Occupied"}
          </span>
        </div>

        {/* Quick Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statItem}>
            <div style={styles.statIcon}>💰</div>
            <div>
              <div style={styles.statLabel}>Starting from</div>
              <div style={styles.statValue}>
                ₹{getStartingPrice()} / month
              </div>
            </div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statIcon}>🏠</div>
            <div>
              <div style={styles.statLabel}>Total {isToLet ? "Properties" : "Rooms"}</div>
              <div style={styles.statValue}>{pg.total_rooms || "—"}</div>
            </div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statIcon}>✅</div>
            <div>
              <div style={styles.statLabel}>Facilities</div>
              <div style={styles.statValue}>{availableFacilitiesCount}+</div>
            </div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statIcon}>📍</div>
            <div>
              <div style={styles.statLabel}>Nearby Places</div>
              <div style={styles.statValue}>{nearbyHighlights.length}+</div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Sections */}
      <div style={styles.twoColumn}>
        {/* LEFT COLUMN */}
        <div style={styles.leftColumn}>
          {/* ABOUT PROPERTY */}
          {pg.description && (
            <Section title="📝 About this Property">
              <p style={styles.description}>{pg.description}</p>
            </Section>
          )}

          {/* PRICE DETAILS SECTION - NEW */}
          {hasPriceDetails() && (
            <Section title="💰 Price Details">
              <PriceDetails pg={pg} />
            </Section>
          )}

          {/* FACILITIES & AMENITIES */}
          {hasFacilitiesContent() && (
            <Section 
              title={`🏠 Facilities & Amenities`} 
              badgeCount={availableFacilitiesCount}
            >
              {/* Facility Categories Filter */}
              <div style={styles.facilityCategories}>
                {facilityCategories.map(category => {
                  const trueCount = getTrueFacilitiesCountInCategory(category.id);
                  
                  if (trueCount === 0 && category.id !== "all") return null;
                  
                  return (
                    <button
                      key={category.id}
                      style={{
                        ...styles.facilityCategoryBtn,
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
                      <span style={styles.facilityCategoryIcon}>{category.icon}</span>
                      <span style={styles.facilityCategoryLabel}>
                        {category.label} {trueCount > 0 && `(${trueCount})`}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Interactive Facilities Grid */}
              {filteredFacilities.length > 0 ? (
                <div style={styles.facilitiesGrid}>
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
                <div style={styles.noFacilitiesContainer}>
                  <div style={styles.noFacilitiesIcon}>🏢</div>
                  <p style={styles.noContentText}>
                    No {selectedFacilityCategory === "all" ? "" : selectedFacilityCategory} facilities available
                  </p>
                </div>
              )}

              {/* Water Type Display */}
              {pg.water_type && (
                <div style={styles.waterSource}>
                  <strong>💧 Water Source:</strong> {pg.water_type === "borewell" ? "Borewell" : 
                                                 pg.water_type === "kaveri" ? "Kaveri" : 
                                                 pg.water_type === "both" ? "Both" : 
                                                 pg.water_type === "municipal" ? "Municipal" : pg.water_type}
                </div>
              )}
            </Section>
          )}

          {/* RULES & RESTRICTIONS */}
          {hasRulesContent() && (
            <Section title="📜 House Rules & Restrictions">
              <div style={styles.rulesContainer}>
                {/* VISITOR RULES */}
                {(pg.visitor_allowed || pg.couple_allowed || pg.family_allowed) && (
                  <div style={styles.rulesSection}>
                    <div style={styles.rulesSectionHeader} onClick={() => toggleRulesSection('visitors')}>
                      <h4 style={styles.rulesSectionTitle}>
                        <span style={styles.rulesSectionIcon}>👥</span>
                        Visitor Rules
                      </h4>
                      <span style={styles.rulesToggle}>
                        {expandedRules.visitors ? '−' : '+'}
                      </span>
                    </div>
                    {expandedRules.visitors && (
                      <div style={styles.rulesGrid}>
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

                {/* LIFESTYLE RULES */}
                {(pg.smoking_allowed || pg.drinking_allowed || pg.outside_food_allowed || pg.parties_allowed) && (
                  <div style={styles.rulesSection}>
                    <div style={styles.rulesSectionHeader} onClick={() => toggleRulesSection('lifestyle')}>
                      <h4 style={styles.rulesSectionTitle}>
                        <span style={styles.rulesSectionIcon}>🚬</span>
                        Lifestyle Rules
                      </h4>
                      <span style={styles.rulesToggle}>
                        {expandedRules.lifestyle ? '−' : '+'}
                      </span>
                    </div>
                    {expandedRules.lifestyle && (
                      <div style={styles.rulesGrid}>
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

                {/* PETS & ENTRY RULES */}
                {(pg.pets_allowed || pg.late_night_entry_allowed || pg.entry_curfew_time) && (
                  <div style={styles.rulesSection}>
                    <div style={styles.rulesSectionHeader} onClick={() => toggleRulesSection('pets')}>
                      <h4 style={styles.rulesSectionTitle}>
                        <span style={styles.rulesSectionIcon}>🐾</span>
                        Pets & Entry Rules
                      </h4>
                      <span style={styles.rulesToggle}>
                        {expandedRules.pets ? '−' : '+'}
                      </span>
                    </div>
                    {expandedRules.pets && (
                      <div style={styles.rulesGrid}>
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

                {/* RESTRICTIONS */}
                {(pg.loud_music_restricted || pg.office_going_only || pg.students_only || pg.boys_only || pg.girls_only || pg.subletting_allowed) && (
                  <div style={styles.rulesSection}>
                    <div style={styles.rulesSectionHeader} onClick={() => toggleRulesSection('restrictions')}>
                      <h4 style={styles.rulesSectionTitle}>
                        <span style={styles.rulesSectionIcon}>🎯</span>
                        Restrictions
                      </h4>
                      <span style={styles.rulesToggle}>
                        {expandedRules.restrictions ? '−' : '+'}
                      </span>
                    </div>
                    {expandedRules.restrictions && (
                      <div style={styles.rulesGrid}>
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

                {/* LEGAL & DURATION */}
                {(pg.min_stay_months || pg.agreement_mandatory || pg.id_proof_mandatory) && (
                  <div style={styles.rulesSection}>
                    <div style={styles.rulesSectionHeader} onClick={() => toggleRulesSection('legal')}>
                      <h4 style={styles.rulesSectionTitle}>
                        <span style={styles.rulesSectionIcon}>⚖️</span>
                        Legal & Duration
                      </h4>
                      <span style={styles.rulesToggle}>
                        {expandedRules.legal ? '−' : '+'}
                      </span>
                    </div>
                    {expandedRules.legal && (
                      <div style={styles.rulesGrid}>
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

        {/* RIGHT COLUMN */}
        <div style={styles.rightColumn}>
          {/* LOCATION MAP */}
          {hasLocation && (
            <Section title="📍 Location">
              <div id="location-map" style={styles.mapContainer}>
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  style={{ height: "250px", width: "100%", borderRadius: "12px" }}
                  key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[pg.latitude, pg.longitude]}>
                    <Popup>
                      <div style={styles.mapPopup}>
                        <strong style={styles.mapPopupTitle}>{pg.pg_name}</strong><br/>
                        <small style={styles.mapPopupAddress}>{pg.address}</small><br/>
                        <button 
                          style={styles.mapPopupButton}
                          onClick={() => handleBookNow()}
                        >
                          Book Now
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
                
                <div style={styles.locationDetails}>
                  <InfoRow label="Area" value={pg.area} />
                  <InfoRow label="Road" value={pg.road} />
                  <InfoRow label="Landmark" value={pg.landmark} />
                  <InfoRow label="City" value={pg.city} />
                </div>
              </div>
            </Section>
          )}

          {/* NEARBY HIGHLIGHTS SECTION */}
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

          {/* NEARBY PGs SECTION */}
          {shouldShowNearbyPGs && (
            <NearbyPGsPanel
              nearbyPGs={nearbyPGs}
              isLoading={loadingNearbyPGs}
              onViewPG={handleViewNearbyPG}
            />
          )}

          {/* CONTACT INFORMATION */}
          {(hasOwnerContact || hasContactPerson || pg?.contact_email) && (
            <div style={styles.contactCard}>
              <h3 style={styles.contactTitle}>📞 Contact Information</h3>
              {hasContactPerson && (
                <div style={styles.contactItem}>
                  <span style={styles.contactIcon}>👤</span>
                  <div>
                    <div style={styles.contactLabel}>Contact Person</div>
                    <div style={styles.contactValue}>{pg.contact_person}</div>
                  </div>
                </div>
              )}
              
              {hasOwnerContact && (
                <div style={styles.contactItem}>
                  <span style={styles.contactIcon}>📱</span>
                  <div>
                    <div style={styles.contactLabel}>Phone Number</div>
                    <div style={styles.contactValue}>
                      <a href={`tel:${pg.contact_phone}`} style={styles.phoneLink}>
                        {pg.contact_phone}
                      </a>
                    </div>
                  </div>
                </div>
              )}
              
              {pg.contact_email && (
                <div style={styles.contactItem}>
                  <span style={styles.contactIcon}>✉️</span>
                  <div>
                    <div style={styles.contactLabel}>Email</div>
                    <div style={styles.contactValue}>
                      <a href={`mailto:${pg.contact_email}`} style={styles.emailLink}>
                        {pg.contact_email}
                      </a>
                    </div>
                  </div>
                </div>
              )}
              
              <div style={styles.contactButtons}>
                <button
                  style={styles.bookButtonSmall}
                  onClick={() => handleBookNow()}
                >
                  🏠 Book Now
                </button>
                {hasOwnerContact && (
                  <button
                    style={styles.callButtonSmall}
                    onClick={handleCallOwner}
                  >
                    📞 Call Now
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ROOM AVAILABILITY */}
          {(pg.total_rooms || pg.available_rooms) && (
            <div style={styles.availabilityCard}>
              <h3 style={styles.availabilityTitle}>🛏 Availability Status</h3>
              {pg.total_rooms && (
                <div style={styles.availabilityItem}>
                  <div style={styles.availabilityLabel}>Total {isToLet ? "Properties" : "Rooms"}</div>
                  <div style={styles.availabilityValue}>{pg.total_rooms}</div>
                </div>
              )}
              {(pg.available_rooms || pg.available_rooms === 0) && (
                <div style={styles.availabilityItem}>
                  <div style={styles.availabilityLabel}>Available Now</div>
                  <div style={{
                    ...styles.availabilityValue,
                    color: pg.available_rooms > 0 ? "#10b981" : "#ef4444"
                  }}>
                    {pg.available_rooms > 0 ? `${pg.available_rooms} Available` : "Fully Occupied"}
                  </div>
                </div>
              )}
              <div style={styles.availabilityNote}>
                {pg.available_rooms > 0 
                  ? "Book now to secure your spot!" 
                  : "Check back later for availability"}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Action Bar */}
      <div style={styles.stickyBar}>
        <div style={styles.stickyContent}>
          <div>
            <div style={styles.stickyPrice}>₹{getStartingPrice()} / month</div>
            <div style={styles.stickyInfo}>
              {pg.pg_name} • {pg.area || pg.city}
            </div>
          </div>
          <div style={styles.stickyActions}>
            <button
              style={styles.stickyBookButton}
              onClick={() => handleBookNow()}
            >
              🏠 Book Now
            </button>
            {hasOwnerContact && (
              <button
                style={styles.stickyCallButton}
                onClick={handleCallOwner}
              >
                📞 Call Owner
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>🏠 Book {pg.pg_name}</h2>
              <button 
                style={styles.modalCloseButton}
                onClick={() => setShowBookingModal(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleBookingSubmit} style={styles.bookingForm}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={bookingData.name}
                  onChange={handleInputChange}
                  style={styles.formInput}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={bookingData.email}
                  onChange={handleInputChange}
                  style={styles.formInput}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={bookingData.phone}
                  onChange={handleInputChange}
                  style={styles.formInput}
                  placeholder="Enter your phone number"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Check-in Date *</label>
                <input
                  type="date"
                  name="checkInDate"
                  value={bookingData.checkInDate}
                  onChange={handleInputChange}
                  style={styles.formInput}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Additional Message</label>
                <textarea
                  name="message"
                  value={bookingData.message}
                  onChange={handleInputChange}
                  style={styles.formTextarea}
                  placeholder="Any special requirements..."
                  rows="3"
                />
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => setShowBookingModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.submitButton}
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  page: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },

  // Loading
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
  },

  // Error
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    padding: "20px",
    textAlign: "center",
  },
  backButton: {
    marginTop: "20px",
    padding: "10px 20px",
    backgroundColor: "#667eea",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.3s ease",
    "&:hover": {
      backgroundColor: "#5a6fd8",
      transform: "translateY(-2px)",
      boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
    },
  },

  // Breadcrumb
  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "20px",
    fontSize: "14px",
    color: "#666",
    padding: "10px 0",
  },
  breadcrumbLink: {
    color: "#667eea",
    cursor: "pointer",
    textDecoration: "none",
    fontWeight: "500",
    transition: "all 0.2s",
    "&:hover": {
      color: "#5a6fd8",
      textDecoration: "underline",
    },
  },
  breadcrumbSeparator: {
    color: "#cbd5e1",
  },
  breadcrumbCurrent: {
    color: "#334155",
    fontWeight: "600",
  },

  // Media Slider
  slider: {
    position: "relative",
    borderRadius: "16px",
    overflow: "hidden",
    marginBottom: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    transition: "all 0.3s ease",
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
    left: "20px",
    transform: "translateY(-50%)",
    backgroundColor: "rgba(255,255,255,0.9)",
    border: "none",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    fontSize: "20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
    transition: "all 0.3s ease",
    "&:hover": {
      backgroundColor: "white",
      transform: "translateY(-50%) scale(1.1)",
    },
  },
  navBtnRight: {
    position: "absolute",
    top: "50%",
    right: "20px",
    transform: "translateY(-50%)",
    backgroundColor: "rgba(255,255,255,0.9)",
    border: "none",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    fontSize: "20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
    transition: "all 0.3s ease",
    "&:hover": {
      backgroundColor: "white",
      transform: "translateY(-50%) scale(1.1)",
    },
  },
  mediaCounter: {
    position: "absolute",
    bottom: "20px",
    right: "20px",
    backgroundColor: "rgba(0,0,0,0.7)",
    color: "white",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "500",
    backdropFilter: "blur(4px)",
  },
  noMedia: {
    height: "200px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: "16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "20px",
    color: "white",
  },
  noMediaIcon: {
    fontSize: "48px",
    marginBottom: "10px",
    opacity: 0.8,
  },

  // Main Card
  mainCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px",
    flexWrap: "wrap",
    gap: "20px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1e293b",
    margin: "0 0 8px 0",
    lineHeight: "1.2",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  address: {
    fontSize: "15px",
    color: "#64748b",
    margin: "0 0 4px 0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  landmark: {
    fontSize: "14px",
    color: "#94a3b8",
    margin: "0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  actionButtons: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  bookButton: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    whiteSpace: "nowrap",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 8px 25px rgba(16, 185, 129, 0.4)",
    },
  },
  callButton: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    whiteSpace: "nowrap",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 8px 25px rgba(59, 130, 246, 0.4)",
    },
  },
  directionButton: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    whiteSpace: "nowrap",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(139, 92, 246, 0.3)",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 8px 25px rgba(139, 92, 246, 0.4)",
    },
  },

  // Badges
  badgeRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "24px",
  },
  typeBadge: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    boxShadow: "0 2px 8px rgba(102, 126, 234, 0.3)",
  },
  genderBadge: {
    background: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
    color: "white",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    boxShadow: "0 2px 8px rgba(236, 72, 153, 0.3)",
  },
  bhkBadge: {
    background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
    color: "white",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    boxShadow: "0 2px 8px rgba(139, 92, 246, 0.3)",
  },
  furnishingBadge: {
    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    color: "white",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    boxShadow: "0 2px 8px rgba(245, 158, 11, 0.3)",
  },
  availabilityBadge: {
    color: "white",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
  },

  // Stats Grid
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    padding: "16px",
    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },
  statItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "translateY(-2px)",
    },
  },
  statIcon: {
    fontSize: "24px",
    width: "48px",
    height: "48px",
    backgroundColor: "white",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    transition: "all 0.3s ease",
  },
  statLabel: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "2px",
    fontWeight: "500",
  },
  statValue: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#1e293b",
  },

  // Price Details Styles
  priceDetailsContainer: {
    padding: "16px",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },
  priceSection: {
    marginBottom: "24px",
    "&:last-child": {
      marginBottom: "0",
    },
  },
  priceSectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0 0 16px 0",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  priceSectionIcon: {
    fontSize: "20px",
  },
  priceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
  },
  priceItem: {
    backgroundColor: "white",
    padding: "16px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    textAlign: "center",
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
      borderColor: "#667eea",
    },
  },
  priceType: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#64748b",
    marginBottom: "8px",
  },
  priceValue: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#10b981",
    marginBottom: "6px",
  },
  depositAmount: {
    fontSize: "12px",
    color: "#ef4444",
    fontWeight: "500",
    backgroundColor: "#fef2f2",
    padding: "4px 8px",
    borderRadius: "6px",
    display: "inline-block",
  },
  bhkInfo: {
    marginTop: "12px",
    fontSize: "14px",
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    padding: "8px 12px",
    borderRadius: "8px",
    display: "inline-block",
  },
  priceCategory: {
    marginBottom: "20px",
  },
  priceCategoryTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#334155",
    marginBottom: "12px",
    paddingLeft: "8px",
    borderLeft: "4px solid #667eea",
  },
  includesInfo: {
    marginTop: "12px",
    fontSize: "14px",
    color: "#059669",
    backgroundColor: "#d1fae5",
    padding: "8px 12px",
    borderRadius: "8px",
    fontWeight: "500",
  },
  additionalCharges: {
    marginTop: "20px",
    padding: "16px",
    backgroundColor: "white",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  },
  additionalChargesTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#334155",
    marginBottom: "12px",
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
    borderBottom: "1px solid #f1f5f9",
    "&:last-child": {
      borderBottom: "none",
    },
  },
  chargeLabel: {
    fontSize: "14px",
    color: "#64748b",
  },
  chargeValue: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b",
  },
  foodCharges: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    backgroundColor: "#f0fdf4",
    borderRadius: "10px",
    border: "1px solid #86efac",
    marginTop: "16px",
  },
  foodChargesIcon: {
    fontSize: "24px",
  },
  foodChargesLabel: {
    fontSize: "12px",
    color: "#64748b",
  },
  foodChargesValue: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#059669",
  },
  noPriceContainer: {
    textAlign: "center",
    padding: "40px 20px",
    backgroundColor: "#f1f5f9",
    borderRadius: "10px",
    border: "1px dashed #cbd5e1",
  },
  noPriceIcon: {
    fontSize: "48px",
    marginBottom: "12px",
    opacity: 0.5,
  },
  noPriceText: {
    fontSize: "14px",
    color: "#64748b",
  },

  // Two Column Layout
  twoColumn: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "20px",
    marginBottom: "100px",
    "@media (max-width: 1024px)": {
      gridTemplateColumns: "1fr",
    },
  },
  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  rightColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  // Section
  section: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0",
    transition: "all 0.3s ease",
    "&:hover": {
      boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
      transform: "translateY(-2px)",
    },
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "20px",
    paddingBottom: "12px",
    borderBottom: "2px solid #f1f5f9",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  sectionBadge: {
    backgroundColor: "#3b82f6",
    color: "white",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
    minWidth: "24px",
    textAlign: "center",
  },

  // Description
  description: {
    fontSize: "15px",
    lineHeight: "1.7",
    color: "#475569",
    margin: "0",
  },

  // No facilities container
  noFacilitiesContainer: {
    textAlign: "center",
    padding: "40px 20px",
    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    borderRadius: "10px",
    marginTop: "10px",
    border: "1px dashed #cbd5e1",
  },
  noFacilitiesIcon: {
    fontSize: "48px",
    marginBottom: "15px",
    opacity: 0.5,
  },
  noContentText: {
    color: "#64748b",
    fontSize: "15px",
    fontWeight: "500",
    marginBottom: "8px",
  },

  // Facility Categories
  facilityCategories: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "20px",
  },
  facilityCategoryBtn: {
    padding: "8px 12px",
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    },
  },
  facilityCategoryIcon: {
    fontSize: "14px",
  },
  facilityCategoryLabel: {
    fontSize: "12px",
  },

  // Facilities
  facilitiesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "12px",
  },
  facilityItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    transition: "all 0.3s",
    cursor: "pointer",
    position: "relative",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
    },
  },
  facilityItemActive: {
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
    },
  },
  facilityItemInactive: {
    opacity: 0.6,
    "&:hover": {
      backgroundColor: "#f8fafc",
    },
  },
  facilityIcon: {
    fontSize: "18px",
    width: "32px",
    height: "32px",
    backgroundColor: "white",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  facilityLabel: {
    fontSize: "14px",
    color: "#334155",
    fontWeight: "500",
    flex: 1,
  },
  checkmark: {
    color: "#10b981",
    fontWeight: "bold",
    fontSize: "14px",
  },
  waterSource: {
    marginTop: "16px",
    padding: "12px",
    background: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#0369a1",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    border: "1px solid #7dd3fc",
  },

  // Rules & Restrictions
  rulesContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  rulesSection: {
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
  },
  rulesSectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px",
    cursor: "pointer",
    backgroundColor: "white",
    transition: "all 0.3s ease",
    "&:hover": {
      backgroundColor: "#f1f5f9",
    },
  },
  rulesSectionTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  rulesSectionIcon: {
    fontSize: "16px",
  },
  rulesToggle: {
    fontSize: "18px",
    color: "#64748b",
    fontWeight: "500",
    transition: "all 0.3s ease",
  },
  rulesGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "12px",
    padding: "16px",
    paddingTop: "0",
  },
  ruleItem: {
    display: "flex",
    gap: "12px",
    padding: "16px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
    },
  },
  ruleIconContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  ruleIcon: {
    fontSize: "20px",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
  },
  ruleContent: {
    flex: 1,
  },
  ruleLabel: {
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "4px",
  },
  ruleDescription: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "8px",
  },
  ruleStatus: {
    display: "flex",
    alignItems: "center",
  },
  ruleStatusBadge: {
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "600",
    color: "white",
  },

  // Map & Location
  mapContainer: {
    marginBottom: "20px",
  },
  mapPopup: {
    padding: "10px",
    maxWidth: "200px",
  },
  mapPopupTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "4px",
  },
  mapPopupAddress: {
    fontSize: "12px",
    color: "#6b7280",
    marginBottom: "8px",
  },
  mapPopupButton: {
    padding: "6px 12px",
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    marginTop: "8px",
    "&:hover": {
      backgroundColor: "#0da271",
    },
  },
  locationDetails: {
    marginTop: "16px",
    padding: "16px",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },
  infoRow: {
    padding: "8px 0",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "14px",
    color: "#475569",
    "&:last-child": {
      borderBottom: "none",
    },
    "& strong": {
      color: "#334155",
    },
  },

  // Nearby PGs Panel
  nearbyPGsPanel: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0",
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
    fontWeight: "600",
    color: "#1e293b",
    margin: "0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  nearbyPGsIcon: {
    fontSize: "20px",
  },
  nearbyPGsCount: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "500",
    backgroundColor: "#f1f5f9",
    padding: "4px 8px",
    borderRadius: "6px",
  },
  nearbyPGsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
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
    color: "#3b82f6",
    border: "1px solid #3b82f6",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    "&:hover": {
      backgroundColor: "#3b82f6",
      color: "white",
      transform: "translateY(-2px)",
      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
    },
  },

  // Nearby PG Card
  nearbyPgCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
    cursor: "pointer",
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
      borderColor: "#3b82f6",
    },
  },
  nearbyPgImageContainer: {
    position: "relative",
    height: "140px",
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
    top: "10px",
    left: "10px",
    right: "10px",
    display: "flex",
    justifyContent: "space-between",
  },
  nearbyPgTypeBadge: {
    backgroundColor: "rgba(59, 130, 246, 0.9)",
    color: "white",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "500",
    backdropFilter: "blur(4px)",
  },
  nearbyPgDistanceBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.9)",
    color: "white",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "500",
    backdropFilter: "blur(4px)",
  },
  nearbyPgContent: {
    padding: "16px",
  },
  nearbyPgTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0 0 8px 0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  nearbyPgAddress: {
    fontSize: "12px",
    color: "#64748b",
    margin: "0 0 12px 0",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  nearbyPgStats: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
  nearbyPgStat: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  nearbyPgStatIcon: {
    fontSize: "14px",
    color: "#64748b",
  },
  nearbyPgStatText: {
    fontSize: "12px",
    color: "#334155",
    fontWeight: "500",
  },
  nearbyPgFacilities: {
    display: "flex",
    gap: "8px",
    marginBottom: "12px",
    flexWrap: "wrap",
  },
  nearbyPgFacility: {
    fontSize: "16px",
    backgroundColor: "#f1f5f9",
    padding: "4px",
    borderRadius: "4px",
  },
  nearbyPgViewButton: {
    width: "100%",
    padding: "8px",
    backgroundColor: "#f1f5f9",
    color: "#334155",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.3s ease",
    "&:hover": {
      backgroundColor: "#3b82f6",
      color: "white",
    },
  },

  // Loading Nearby PGs
  loadingNearbyPGs: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    textAlign: "center",
    border: "1px dashed #cbd5e1",
  },
  noNearbyPGs: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    textAlign: "center",
    border: "1px dashed #cbd5e1",
  },
  noNearbyPGsIcon: {
    fontSize: "48px",
    marginBottom: "16px",
    opacity: 0.5,
  },
  noNearbyPGsTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#334155",
    marginBottom: "8px",
  },
  noNearbyPGsText: {
    fontSize: "14px",
    color: "#64748b",
    maxWidth: "300px",
  },

  // Nearby Highlights Panel
  highlightsPanel: {
    backgroundColor: "white",
    borderRadius: "16px",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
  },
  categoriesPills: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    padding: "16px",
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
  },
  highlightCategoryBtn: {
    padding: "8px 12px",
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.3s ease",
    whiteSpace: "nowrap",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    },
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
      "&:hover": {
        transform: "none",
        boxShadow: "none",
      },
    },
  },
  highlightCategoryIcon: {
    fontSize: "14px",
  },
  highlightCategoryLabel: {
    fontSize: "12px",
  },
  highlightCategoryCount: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: "2px 6px",
    borderRadius: "10px",
    fontSize: "10px",
    fontWeight: "600",
  },
  highlightsList: {
    padding: "0",
  },
  highlightsListHeader: {
    padding: "16px",
    borderBottom: "1px solid #f1f5f9",
    backgroundColor: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  highlightsListTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  categoryIndicator: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    display: "inline-block",
  },
  highlightsCount: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "500",
    backgroundColor: "#f1f5f9",
    padding: "4px 8px",
    borderRadius: "6px",
  },
  highlightsItemsContainer: {
    maxHeight: "400px",
    overflowY: "auto",
    "&::-webkit-scrollbar": {
      width: "6px",
    },
    "&::-webkit-scrollbar-track": {
      background: "#f1f5f9",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "#cbd5e1",
      borderRadius: "3px",
    },
    "&::-webkit-scrollbar-thumb:hover": {
      background: "#94a3b8",
    },
  },
  highlightItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    borderBottom: "1px solid #f1f5f9",
    backgroundColor: "white",
    transition: "all 0.3s ease",
    cursor: "pointer",
    "&:hover": {
      backgroundColor: "#f8fafc",
    },
    "&:last-child": {
      borderBottom: "none",
    },
  },
  highlightIconContainer: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  highlightIcon: {
    fontSize: "18px",
    color: "white",
  },
  highlightContent: {
    flex: 1,
    minWidth: 0,
  },
  highlightName: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#334155",
    marginBottom: "4px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  highlightType: {
    fontSize: "11px",
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    padding: "2px 6px",
    borderRadius: "10px",
    display: "inline-block",
    textTransform: "capitalize",
  },
  highlightDistance: {
    fontSize: "11px",
    color: "#64748b",
    display: "block",
    marginTop: "4px",
  },
  viewOnMapButton: {
    padding: "6px 12px",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.3s",
    whiteSpace: "nowrap",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    "&:hover": {
      transform: "scale(1.05)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    },
  },

  // Loading Highlights Panel
  loadingHighlightsPanel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    textAlign: "center",
    border: "1px dashed #cbd5e1",
  },
  noHighlightsPanel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    textAlign: "center",
    border: "1px dashed #cbd5e1",
  },
  noHighlightsIcon: {
    fontSize: "48px",
    marginBottom: "16px",
    opacity: 0.5,
  },
  noHighlightsTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#334155",
    marginBottom: "8px",
  },
  noHighlightsText: {
    fontSize: "14px",
    color: "#64748b",
    maxWidth: "300px",
  },

  // Contact Card
  contactCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0",
  },
  contactTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0 0 16px 0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  contactItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 0",
    borderBottom: "1px solid #f1f5f9",
    "&:last-child": {
      borderBottom: "none",
    },
  },
  contactIcon: {
    fontSize: "20px",
    width: "40px",
    height: "40px",
    backgroundColor: "#f1f5f9",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
  },
  contactLabel: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "2px",
  },
  contactValue: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#334155",
  },
  phoneLink: {
    color: "#334155",
    textDecoration: "none",
    transition: "all 0.3s",
    "&:hover": {
      color: "#3b82f6",
    },
  },
  emailLink: {
    color: "#3b82f6",
    textDecoration: "none",
    transition: "all 0.3s",
    "&:hover": {
      color: "#2563eb",
      textDecoration: "underline",
    },
  },
  contactButtons: {
    display: "flex",
    gap: "8px",
    marginTop: "16px",
  },
  bookButtonSmall: {
    flex: "1",
    padding: "10px",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
    },
  },
  callButtonSmall: {
    flex: "1",
    padding: "10px",
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
    },
  },

  // Availability Card
  availabilityCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0",
  },
  availabilityTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0 0 16px 0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  availabilityItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid #f1f5f9",
    "&:last-child": {
      borderBottom: "none",
    },
  },
  availabilityLabel: {
    fontSize: "14px",
    color: "#64748b",
  },
  availabilityValue: {
    fontSize: "16px",
    fontWeight: "700",
  },
  availabilityNote: {
    marginTop: "12px",
    fontSize: "13px",
    color: "#64748b",
    textAlign: "center",
    fontStyle: "italic",
    padding: "8px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
  },

  // Sticky Bar
  stickyBar: {
    position: "fixed",
    bottom: "0",
    left: "0",
    right: "0",
    backgroundColor: "white",
    padding: "12px 20px",
    boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
    zIndex: "1000",
    backdropFilter: "blur(10px)",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  stickyContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
  },
  stickyPrice: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#1e293b",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  stickyInfo: {
    fontSize: "13px",
    color: "#64748b",
  },
  stickyActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  stickyBookButton: {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 8px 20px rgba(16, 185, 129, 0.4)",
    },
  },
  stickyCallButton: {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 8px 20px rgba(59, 130, 246, 0.4)",
    },
  },

  // Booking Modal
  modalOverlay: {
    position: "fixed",
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: "2000",
    padding: "20px",
    animation: "fadeIn 0.3s ease",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "500px",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    animation: "slideUpModal 0.3s ease",
  },
  modalHeader: {
    padding: "20px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0",
  },
  modalCloseButton: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    color: "#64748b",
    padding: "0",
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    transition: "all 0.3s",
    "&:hover": {
      backgroundColor: "#f1f5f9",
      color: "#334155",
    },
  },
  bookingForm: {
    padding: "20px",
  },
  formGroup: {
    marginBottom: "16px",
  },
  formLabel: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#334155",
  },
  formInput: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#1e293b",
    backgroundColor: "#f8fafc",
    transition: "all 0.3s ease",
    "&:focus": {
      outline: "none",
      borderColor: "#667eea",
      boxShadow: "0 0 0 3px rgba(102, 126, 234, 0.1)",
      backgroundColor: "white",
    },
  },
  formTextarea: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#1e293b",
    backgroundColor: "#f8fafc",
    resize: "vertical",
    minHeight: "80px",
    fontFamily: "inherit",
    "&:focus": {
      outline: "none",
      borderColor: "#667eea",
      boxShadow: "0 0 0 3px rgba(102, 126, 234, 0.1)",
      backgroundColor: "white",
    },
  },
  modalFooter: {
    display: "flex",
    gap: "8px",
    marginTop: "24px",
  },
  cancelButton: {
    flex: "1",
    padding: "12px",
    backgroundColor: "#f1f5f9",
    color: "#64748b",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    "&:hover": {
      backgroundColor: "#e2e8f0",
      transform: "translateY(-2px)",
    },
  },
  submitButton: {
    flex: "2",
    padding: "12px",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
    },
  },
};

// Add CSS animation
const animationStyle = document.createElement('style');
animationStyle.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideUpModal {
    from { transform: translateY(30px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e5e7eb;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
`;
document.head.appendChild(animationStyle);