import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

// Import the API_CONFIG from config
import { API_CONFIG } from "../config"; 

const ScanPG = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pg, setPg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    fetchPGDetails();
    
    // Track the scan
    trackScan();
  }, [id]);

  const fetchPGDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use API_CONFIG.USER_API_URL from config (which already includes /api)
      // and append /scan/${id} (without extra /api)
      const apiUrl = `${API_CONFIG.USER_API_URL}/scan/${id}`;
      console.log("Fetching from:", apiUrl);
      
      const res = await axios.get(apiUrl);

      if (res.data.success) {
        setPg(res.data.data);
      } else {
        setError(res.data.message || "Property not found");
      }
    } catch (err) {
      console.error("QR Scan fetch error:", err);
      setError(
        err.response?.data?.message || 
        "Failed to load property details. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const trackScan = async () => {
    try {
      // Use API_CONFIG.USER_API_URL from config
      const apiUrl = `${API_CONFIG.USER_API_URL}/scan/${id}/track`;
      console.log("Tracking scan at:", apiUrl);
      
      await axios.post(apiUrl, {
        source: 'qr_code'
      });
    } catch (err) {
      console.error("Failed to track scan:", err);
      // Don't show error to user
    }
  };

  const handleViewDetails = () => {
    navigate(`/pg/${id}`);
  };

  const handleCallOwner = () => {
    if (pg?.contact_phone) {
      window.location.href = `tel:${pg.contact_phone}`;
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: pg.pg_name,
          text: `Check out this property: ${pg.pg_name} in ${pg.city}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      // Fallback - copy link to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const nextPhoto = () => {
    if (pg?.photos && currentPhotoIndex < pg.photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif'
    },
    card: {
      maxWidth: '500px',
      width: '100%',
      background: 'white',
      borderRadius: '24px',
      overflow: 'hidden',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      position: 'relative',
      animation: 'slideUp 0.5s ease-out'
    },
    statusBanner: {
      position: 'absolute',
      top: '20px',
      right: '20px',
      background: 'white',
      padding: '8px 16px',
      borderRadius: '30px',
      fontWeight: '600',
      zIndex: 10,
      boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
    },
    statusBannerUnavailable: {
      background: '#ff4757',
      color: 'white'
    },
    photoGallery: {
      position: 'relative',
      width: '100%',
      height: '300px',
      background: '#f0f0f0'
    },
    mainPhoto: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },
    noPhoto: {
      width: '100%',
      height: '300px',
      background: '#f0f0f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    photoNav: {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'rgba(255,255,255,0.8)',
      border: 'none',
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      fontSize: '24px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s',
      zIndex: 5
    },
    photoNavPrev: {
      left: '10px'
    },
    photoNavNext: {
      right: '10px'
    },
    photoNavDisabled: {
      opacity: 0.3,
      cursor: 'not-allowed'
    },
    photoIndicators: {
      position: 'absolute',
      bottom: '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: '8px',
      zIndex: 5
    },
    indicator: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.5)',
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      transition: 'all 0.3s'
    },
    indicatorActive: {
      background: 'white',
      transform: 'scale(1.2)'
    },
    photoCounter: {
      position: 'absolute',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.5)',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      zIndex: 5
    },
    details: {
      padding: '24px'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '10px'
    },
    propertyName: {
      margin: 0,
      fontSize: '24px',
      color: '#333',
      fontWeight: '600'
    },
    shareButton: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '50%',
      transition: 'background 0.3s'
    },
    location: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#666',
      marginBottom: '8px',
      fontSize: '14px'
    },
    address: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#666',
      marginBottom: '8px',
      fontSize: '14px'
    },
    quickStats: {
      display: 'flex',
      gap: '10px',
      margin: '15px 0'
    },
    statBadge: {
      background: '#f0f0f0',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '5px'
    },
    priceCard: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      borderRadius: '12px',
      color: 'white',
      margin: '20px 0'
    },
    priceHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '10px'
    },
    priceLabel: {
      fontSize: '14px',
      opacity: 0.9
    },
    priceValue: {
      fontSize: '28px',
      fontWeight: 'bold'
    },
    priceDetails: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '14px',
      opacity: 0.9
    },
    availabilitySection: {
      margin: '20px 0'
    },
    sectionTitle: {
      fontSize: '16px',
      color: '#333',
      marginBottom: '10px'
    },
    availabilityStats: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '15px',
      background: '#f8f9fa',
      padding: '15px',
      borderRadius: '10px'
    },
    statItem: {
      textAlign: 'center'
    },
    statLabel: {
      display: 'block',
      fontSize: '12px',
      color: '#999',
      marginBottom: '5px'
    },
    statValue: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#333'
    },
    amenitiesPreview: {
      margin: '20px 0'
    },
    amenitiesGrid: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      marginTop: '10px'
    },
    amenityTag: {
      background: '#f0f0f0',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '13px'
    },
    description: {
      margin: '20px 0',
      lineHeight: '1.6',
      color: '#666'
    },
    actionButtons: {
      display: 'flex',
      gap: '15px',
      margin: '20px 0'
    },
    btnPrimary: {
      flex: 1,
      padding: '15px',
      border: 'none',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      transition: 'all 0.3s'
    },
    btnPrimaryDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    btnSecondary: {
      flex: 1,
      padding: '15px',
      border: 'none',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      background: '#f0f0f0',
      color: '#333',
      transition: 'all 0.3s'
    },
    contactInfo: {
      background: '#f8f9fa',
      padding: '15px',
      borderRadius: '10px',
      marginTop: '20px'
    },
    phoneLink: {
      color: '#667eea',
      textDecoration: 'none',
      marginLeft: '5px'
    },
    footer: {
      background: '#f8f9fa',
      padding: '15px',
      textAlign: 'center',
      borderTop: '1px solid #eee',
      fontSize: '12px',
      color: '#999'
    },
    scanTip: {
      marginTop: '5px',
      fontSize: '11px'
    },
    loadingSpinner: {
      textAlign: 'center',
      padding: '50px',
      background: 'white',
      borderRadius: '20px'
    },
    spinner: {
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #764ba2',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      animation: 'spin 1s linear infinite',
      margin: '0 auto 20px'
    },
    errorCard: {
      background: 'white',
      padding: '40px',
      borderRadius: '20px',
      textAlign: 'center',
      maxWidth: '400px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
    },
    errorIcon: {
      fontSize: '48px',
      marginBottom: '20px'
    },
    homeButton: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: '20px'
    }
  };

  // Keyframes animation
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
    }

    .phone-link:hover {
      text-decoration: underline;
    }
  `;
  document.head.appendChild(styleSheet);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingSpinner}>
          <div style={styles.spinner}></div>
          <p>Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error || !pg) {
    return (
      <div style={styles.container}>
        <div style={styles.errorCard}>
          <div style={styles.errorIcon}>🏠</div>
          <h2>Property Not Found</h2>
          <p>{error || "The property you're looking for doesn't exist or has been removed."}</p>
          <button 
            onClick={() => navigate('/')}
            style={styles.homeButton}
          >
            Browse Other Properties
          </button>
        </div>
      </div>
    );
  }

  const isAvailable = pg.is_available && pg.status === 'active';

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        {/* Status Banner */}
        {!isAvailable && (
          <div style={{...styles.statusBanner, ...styles.statusBannerUnavailable}}>
            <span>⚠️ {pg.status_message || 'Currently Unavailable'}</span>
          </div>
        )}

        {/* Photo Gallery */}
        {pg.photos && pg.photos.length > 0 ? (
          <div style={styles.photoGallery}>
            <img 
              src={pg.photos[currentPhotoIndex]} 
              alt={pg.pg_name}
              style={styles.mainPhoto}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
              }}
            />
            
            {pg.photos.length > 1 && (
              <>
                <button 
                  style={{
                    ...styles.photoNav,
                    ...styles.photoNavPrev,
                    ...(currentPhotoIndex === 0 ? styles.photoNavDisabled : {})
                  }}
                  onClick={prevPhoto}
                  disabled={currentPhotoIndex === 0}
                  aria-label="Previous photo"
                >
                  ‹
                </button>
                <button 
                  style={{
                    ...styles.photoNav,
                    ...styles.photoNavNext,
                    ...(currentPhotoIndex === pg.photos.length - 1 ? styles.photoNavDisabled : {})
                  }}
                  onClick={nextPhoto}
                  disabled={currentPhotoIndex === pg.photos.length - 1}
                  aria-label="Next photo"
                >
                  ›
                </button>
                
                <div style={styles.photoIndicators}>
                  {pg.photos.map((_, index) => (
                    <button
                      key={index}
                      style={{
                        ...styles.indicator,
                        ...(index === currentPhotoIndex ? styles.indicatorActive : {})
                      }}
                      onClick={() => setCurrentPhotoIndex(index)}
                      aria-label={`Go to photo ${index + 1}`}
                    />
                  ))}
                </div>

                <div style={styles.photoCounter}>
                  {currentPhotoIndex + 1} / {pg.photos.length}
                </div>
              </>
            )}
          </div>
        ) : (
          <div style={styles.noPhoto}>
            <img 
              src="https://via.placeholder.com/400x300?text=No+Images+Available" 
              alt="No photos available"
              style={styles.mainPhoto}
            />
          </div>
        )}

        {/* Property Details */}
        <div style={styles.details}>
          <div style={styles.header}>
            <h1 style={styles.propertyName}>{pg.pg_name}</h1>
            <button onClick={handleShare} style={styles.shareButton} aria-label="Share">
              📤
            </button>
          </div>
          
          <div style={styles.location}>
            <span>📍</span>
            <span>
              {pg.area && `${pg.area}, `} {pg.city}
              {pg.landmark && ` (near ${pg.landmark})`}
            </span>
          </div>

          {pg.address && (
            <div style={styles.address}>
              <span>📌</span>
              <span>{pg.address}</span>
            </div>
          )}

          {/* Quick Stats */}
          <div style={styles.quickStats}>
            <div style={styles.statBadge}>
              <span>🏠</span>
              <span>{pg.pg_type || 'PG'}</span>
            </div>
            {pg.total_sharing_options > 0 && (
              <div style={styles.statBadge}>
                <span>👥</span>
                <span>{pg.total_sharing_options} Sharing</span>
              </div>
            )}
          </div>

          {/* Price Card */}
          <div style={styles.priceCard}>
            <div style={styles.priceHeader}>
              <span style={styles.priceLabel}>Starting from</span>
              <span style={styles.priceValue}>₹{pg.rent_amount?.toLocaleString() || 'N/A'}</span>
            </div>
            <div style={styles.priceDetails}>
              {pg.deposit_amount > 0 && (
                <span>Deposit: ₹{pg.deposit_amount.toLocaleString()}</span>
              )}
              {pg.maintenance_amount > 0 && (
                <span>Maintenance: ₹{pg.maintenance_amount}/month</span>
              )}
            </div>
          </div>

          {/* Availability */}
          <div style={styles.availabilitySection}>
            <h3 style={styles.sectionTitle}>Availability</h3>
            <div style={styles.availabilityStats}>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Available Rooms</span>
                <span style={styles.statValue}>{pg.available_rooms || 0}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Total Rooms</span>
                <span style={styles.statValue}>{pg.total_rooms || 0}</span>
              </div>
            </div>
          </div>

          {/* Amenities Preview */}
          <div style={styles.amenitiesPreview}>
            <h3 style={styles.sectionTitle}>Amenities</h3>
            <div style={styles.amenitiesGrid}>
              {pg.wifi_available && <span style={styles.amenityTag}>📶 WiFi</span>}
              {pg.ac_available && <span style={styles.amenityTag}>❄️ AC</span>}
              {pg.food_available && <span style={styles.amenityTag}>🍛 Food</span>}
              {pg.parking_available && <span style={styles.amenityTag}>🅿️ Parking</span>}
              {pg.cctv && <span style={styles.amenityTag}>📹 CCTV</span>}
              {pg.gym && <span style={styles.amenityTag}>💪 Gym</span>}
            </div>
          </div>

          {/* Description */}
          {pg.description && (
            <div style={styles.description}>
              <h3 style={styles.sectionTitle}>About this property</h3>
              <p>{pg.description}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div style={styles.actionButtons}>
            <button 
              onClick={handleViewDetails}
              style={{
                ...styles.btnPrimary,
                ...(!isAvailable ? styles.btnPrimaryDisabled : {})
              }}
              disabled={!isAvailable}
            >
              {isAvailable ? 'View Full Details' : 'Check Similar Properties'}
            </button>

            {pg.contact_phone && (
              <button 
                onClick={handleCallOwner}
                style={styles.btnSecondary}
              >
                📞 Call {pg.contact_person || 'Owner'}
              </button>
            )}
          </div>

          {/* Contact Info */}
          {pg.contact_person && (
            <div style={styles.contactInfo}>
              <p>
                <strong>Contact Person:</strong> {pg.contact_person}
              </p>
              {pg.contact_phone && (
                <p>
                  <strong>Phone:</strong> 
                  <a href={`tel:${pg.contact_phone}`} style={styles.phoneLink} className="phone-link">
                    {pg.contact_phone}
                  </a>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p>📱 Scan QR code to view property details instantly</p>
          <p style={styles.scanTip}>Share this QR code with friends looking for accommodation</p>
        </div>
      </div>
    </div>
  );
};

export default ScanPG;