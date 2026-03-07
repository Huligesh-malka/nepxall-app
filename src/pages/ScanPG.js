import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ScanPG.css";

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

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      const res = await axios.get(`${API_URL}/api/scan/${id}`);

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
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      await axios.post(`${API_URL}/api/scan/${id}/track`, {
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

  if (loading) {
    return (
      <div className="scan-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error || !pg) {
    return (
      <div className="scan-container">
        <div className="error-card">
          <div className="error-icon">🏠</div>
          <h2>Property Not Found</h2>
          <p>{error || "The property you're looking for doesn't exist or has been removed."}</p>
          <button 
            onClick={() => navigate('/')}
            className="home-button"
          >
            Browse Other Properties
          </button>
        </div>
      </div>
    );
  }

  const isAvailable = pg.is_available && pg.status === 'active';

  return (
    <div className="scan-container">
      <div className="property-card">
        
        {/* Status Banner */}
        {!isAvailable && (
          <div className="status-banner unavailable">
            <span>⚠️ {pg.status_message || 'Currently Unavailable'}</span>
          </div>
        )}

        {/* Photo Gallery */}
        {pg.photos && pg.photos.length > 0 ? (
          <div className="photo-gallery">
            <img 
              src={pg.photos[currentPhotoIndex]} 
              alt={pg.pg_name}
              className="main-photo"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
              }}
            />
            
            {pg.photos.length > 1 && (
              <>
                <button 
                  className="photo-nav prev"
                  onClick={prevPhoto}
                  disabled={currentPhotoIndex === 0}
                  aria-label="Previous photo"
                >
                  ‹
                </button>
                <button 
                  className="photo-nav next"
                  onClick={nextPhoto}
                  disabled={currentPhotoIndex === pg.photos.length - 1}
                  aria-label="Next photo"
                >
                  ›
                </button>
                
                <div className="photo-indicators">
                  {pg.photos.map((_, index) => (
                    <button
                      key={index}
                      className={`indicator ${index === currentPhotoIndex ? 'active' : ''}`}
                      onClick={() => setCurrentPhotoIndex(index)}
                      aria-label={`Go to photo ${index + 1}`}
                    />
                  ))}
                </div>

                <div className="photo-counter">
                  {currentPhotoIndex + 1} / {pg.photos.length}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="no-photo">
            <img 
              src="https://via.placeholder.com/400x300?text=No+Images+Available" 
              alt="No photos available"
              className="main-photo"
            />
          </div>
        )}

        {/* Property Details */}
        <div className="property-details">
          <div className="property-header">
            <h1 className="property-name">{pg.pg_name}</h1>
            <button onClick={handleShare} className="share-button" aria-label="Share">
              📤
            </button>
          </div>
          
          <div className="property-location">
            <span className="location-icon">📍</span>
            <span>
              {pg.area && `${pg.area}, `} {pg.city}
              {pg.landmark && ` (near ${pg.landmark})`}
            </span>
          </div>

          {pg.address && (
            <div className="property-address">
              <span className="address-icon">📌</span>
              <span>{pg.address}</span>
            </div>
          )}

          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat-badge">
              <span className="stat-icon">🏠</span>
              <span>{pg.pg_type || 'PG'}</span>
            </div>
            {pg.total_sharing_options > 0 && (
              <div className="stat-badge">
                <span className="stat-icon">👥</span>
                <span>{pg.total_sharing_options} Sharing</span>
              </div>
            )}
          </div>

          {/* Price Card */}
          <div className="price-card">
            <div className="price-header">
              <span className="price-label">Starting from</span>
              <span className="price-value">₹{pg.rent_amount?.toLocaleString() || 'N/A'}</span>
            </div>
            <div className="price-details">
              {pg.deposit_amount > 0 && (
                <span>Deposit: ₹{pg.deposit_amount.toLocaleString()}</span>
              )}
              {pg.maintenance_amount > 0 && (
                <span>Maintenance: ₹{pg.maintenance_amount}/month</span>
              )}
            </div>
          </div>

          {/* Availability */}
          <div className="availability-section">
            <h3>Availability</h3>
            <div className="availability-stats">
              <div className="stat-item">
                <span className="stat-label">Available Rooms</span>
                <span className="stat-value">{pg.available_rooms || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Rooms</span>
                <span className="stat-value">{pg.total_rooms || 0}</span>
              </div>
            </div>
          </div>

          {/* Amenities Preview */}
          <div className="amenities-preview">
            <h3>Amenities</h3>
            <div className="amenities-grid">
              {pg.wifi_available && <span className="amenity-tag">📶 WiFi</span>}
              {pg.ac_available && <span className="amenity-tag">❄️ AC</span>}
              {pg.food_available && <span className="amenity-tag">🍛 Food</span>}
              {pg.parking_available && <span className="amenity-tag">🅿️ Parking</span>}
              {pg.cctv && <span className="amenity-tag">📹 CCTV</span>}
              {pg.gym && <span className="amenity-tag">💪 Gym</span>}
            </div>
          </div>

          {/* Description */}
          {pg.description && (
            <div className="property-description">
              <h3>About this property</h3>
              <p>{pg.description}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-buttons">
            <button 
              onClick={handleViewDetails}
              className="btn-primary"
              disabled={!isAvailable}
            >
              {isAvailable ? 'View Full Details' : 'Check Similar Properties'}
            </button>

            {pg.contact_phone && (
              <button 
                onClick={handleCallOwner}
                className="btn-secondary"
              >
                📞 Call {pg.contact_person || 'Owner'}
              </button>
            )}
          </div>

          {/* Contact Info */}
          {pg.contact_person && (
            <div className="contact-info">
              <p>
                <strong>Contact Person:</strong> {pg.contact_person}
              </p>
              {pg.contact_phone && (
                <p>
                  <strong>Phone:</strong> 
                  <a href={`tel:${pg.contact_phone}`} className="phone-link">
                    {pg.contact_phone}
                  </a>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="scan-footer">
          <p>📱 Scan QR code to view property details instantly</p>
          <p className="scan-tip">Share this QR code with friends looking for accommodation</p>
        </div>
      </div>
    </div>
  );
};

export default ScanPG;