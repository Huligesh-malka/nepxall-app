// src/pages/hotels/OwnerHotels.js

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import axios from "axios";

import {
  Home,
  MapPin,
  DollarSign,
  Users,
  Bed,
  Edit,
  Trash2,
  Plus,
  Eye,
  Star,
  Wifi,
  Car,
  Coffee,
  Phone,
  Mail,
  Clock,
  Calendar,
  Check,
  X as XIcon,
  AlertCircle
} from "lucide-react";

const API_BASE = "http://localhost:5000/api/hotels";

export default function OwnerHotels() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalRooms: 0,
    totalBookings: 0
  });
  const [deleteModal, setDeleteModal] = useState(null);

  // Check auth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Load hotels
  useEffect(() => {
    const fetchHotels = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const token = await user.getIdToken();
        const response = await axios.get(`${API_BASE}/owner/${user.uid}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          const hotelsData = response.data.data;
          setHotels(hotelsData);

          // Calculate stats
          const total = hotelsData.length;
          const active = hotelsData.filter(h => h.status !== 'inactive').length;
          const totalRooms = hotelsData.reduce((sum, hotel) => {
            return sum + (hotel.rooms?.reduce((rSum, room) => rSum + (room.total_rooms || 0), 0) || 0);
          }, 0);
          const totalBookings = hotelsData.reduce((sum, hotel) => sum + (hotel.total_bookings || 0), 0);

          setStats({ total, active, totalRooms, totalBookings });
        }
      } catch (error) {
        console.error("Error fetching hotels:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [user]);

  const handleDelete = async (hotelId) => {
    try {
      const token = await user.getIdToken();
      const response = await axios.delete(`${API_BASE}/${hotelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setHotels(hotels.filter(h => h.id !== hotelId));
        setDeleteModal(null);
      }
    } catch (error) {
      console.error("Error deleting hotel:", error);
      alert("Failed to delete hotel");
    }
  };

  const getHotelTypeIcon = (type) => {
    switch(type) {
      case 'hotel': return '🏨';
      case 'resort': return '🏖️';
      case 'hostel': return '🛏️';
      case 'homestay': return '🏠';
      default: return '🏨';
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN').format(price || 0);
  };

  const getImageUrl = (hotel) => {
    if (hotel.photos && hotel.photos.length > 0) {
      return `http://localhost:5000${hotel.photos[0]}`;
    }
    return "https://via.placeholder.com/400x250/6b7280/ffffff?text=No+Image";
  };

  const getRoomSummary = (hotel) => {
    if (!hotel.rooms || hotel.rooms.length === 0) return "No rooms";
    
    const total = hotel.rooms.reduce((sum, r) => sum + (r.total_rooms || 0), 0);
    const minPrice = Math.min(...hotel.rooms.map(r => r.price_per_night || 0));
    const maxPrice = Math.max(...hotel.rooms.map(r => r.price_per_night || 0));
    
    return {
      total,
      minPrice,
      maxPrice,
      types: hotel.rooms.length
    };
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading your hotels...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>My Hotels</h1>
          <p style={styles.subtitle}>Manage your hotel properties</p>
        </div>
        <button
          onClick={() => navigate("/owner/hotels/add")}
          style={styles.addButton}
        >
          <Plus size={20} />
          Add New Hotel
        </button>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={{...styles.statCard, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"}}>
          <div style={styles.statIcon}>
            <Home size={24} />
          </div>
          <div>
            <div style={styles.statValue}>{stats.total}</div>
            <div style={styles.statLabel}>Total Hotels</div>
          </div>
        </div>

        <div style={{...styles.statCard, background: "linear-gradient(135deg, #10b981 0%, #059669 100%)"}}>
          <div style={styles.statIcon}>
            <Bed size={24} />
          </div>
          <div>
            <div style={styles.statValue}>{stats.totalRooms}</div>
            <div style={styles.statLabel}>Total Rooms</div>
          </div>
        </div>

        <div style={{...styles.statCard, background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)"}}>
          <div style={styles.statIcon}>
            <Users size={24} />
          </div>
          <div>
            <div style={styles.statValue}>{stats.totalBookings}</div>
            <div style={styles.statLabel}>Total Bookings</div>
          </div>
        </div>

        <div style={{...styles.statCard, background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"}}>
          <div style={styles.statIcon}>
            <Check size={24} />
          </div>
          <div>
            <div style={styles.statValue}>{stats.active}</div>
            <div style={styles.statLabel}>Active Hotels</div>
          </div>
        </div>
      </div>

      {/* Hotels Grid */}
      {hotels.length === 0 ? (
        <div style={styles.emptyState}>
          <Home size={64} style={{ color: "#9ca3af", marginBottom: 20 }} />
          <h2 style={styles.emptyTitle}>No Hotels Added Yet</h2>
          <p style={styles.emptyText}>Start by adding your first hotel property</p>
          <button
            onClick={() => navigate("/owner/hotels/add")}
            style={styles.emptyButton}
          >
            <Plus size={18} />
            Add Your First Hotel
          </button>
        </div>
      ) : (
        <div style={styles.hotelsGrid}>
          {hotels.map((hotel) => {
            const roomSummary = getRoomSummary(hotel);
            
            return (
              <div key={hotel.id} style={styles.hotelCard}>
                <div style={styles.cardImage}>
                  <img
                    src={getImageUrl(hotel)}
                    alt={hotel.hotel_name}
                    style={styles.image}
                  />
                  <div style={styles.cardBadge}>
                    {getHotelTypeIcon(hotel.hotel_type)} {hotel.hotel_type}
                  </div>
                  <div style={styles.cardActions}>
                    <button
                      onClick={() => navigate(`/owner/hotels/edit/${hotel.id}`)}
                      style={styles.actionBtn}
                      title="Edit Hotel"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteModal(hotel)}
                      style={{...styles.actionBtn, background: "#ef4444"}}
                      title="Delete Hotel"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={() => window.open(`/hotels/${hotel.id}`, '_blank')}
                      style={{...styles.actionBtn, background: "#3b82f6"}}
                      title="View on Site"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>

                <div style={styles.cardContent}>
                  <h3 style={styles.hotelName}>{hotel.hotel_name}</h3>
                  
                  <div style={styles.location}>
                    <MapPin size={14} />
                    <span>{hotel.city}, {hotel.state || 'India'}</span>
                  </div>

                  <div style={styles.roomInfo}>
                    <div style={styles.roomStat}>
                      <Bed size={14} />
                      <span>{roomSummary.total} Rooms</span>
                    </div>
                    <div style={styles.roomStat}>
                      <Users size={14} />
                      <span>{roomSummary.types} Types</span>
                    </div>
                  </div>

                  <div style={styles.priceRange}>
                    <DollarSign size={14} />
                    <span>
                      ₹{formatPrice(roomSummary.minPrice)} - ₹{formatPrice(roomSummary.maxPrice)}
                    </span>
                  </div>

                  <div style={styles.amenities}>
                    {hotel.amenities?.wifi && <Wifi size={14} title="WiFi" />}
                    {hotel.amenities?.parking && <Car size={14} title="Parking" />}
                    {hotel.amenities?.restaurant && <Coffee size={14} title="Restaurant" />}
                    {hotel.amenities?.breakfast && <Coffee size={14} title="Breakfast" />}
                  </div>

                  <div style={styles.contactInfo}>
                    <div style={styles.contactItem}>
                      <Phone size={12} />
                      <span>{hotel.contact_phone}</span>
                    </div>
                    {hotel.contact_email && (
                      <div style={styles.contactItem}>
                        <Mail size={12} />
                        <span>{hotel.contact_email}</span>
                      </div>
                    )}
                  </div>

                  <div style={styles.timingInfo}>
                    <Clock size={12} />
                    <span>Check-in: {hotel.check_in_time} | Check-out: {hotel.check_out_time}</span>
                  </div>

                  <div style={styles.cardFooter}>
                    <div style={styles.bookingsCount}>
                      <Calendar size={14} />
                      <span>{hotel.total_bookings || 0} bookings</span>
                    </div>
                    <div style={hotel.status === 'active' ? styles.statusActive : styles.statusInactive}>
                      {hotel.status === 'active' ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <AlertCircle size={24} color="#ef4444" />
              <h3 style={styles.modalTitle}>Delete Hotel</h3>
              <button onClick={() => setDeleteModal(null)} style={styles.modalClose}>
                <XIcon size={20} />
              </button>
            </div>
            
            <div style={styles.modalContent}>
              <p>Are you sure you want to delete <strong>{deleteModal.hotel_name}</strong>?</p>
              <p style={styles.modalWarning}>This action cannot be undone. All associated data will be permanently removed.</p>
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={() => setDeleteModal(null)}
                style={styles.modalCancel}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteModal.id)}
                style={styles.modalDelete}
              >
                Delete Hotel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 1400,
    margin: "0 auto",
    padding: 30,
    background: "#f8fafc",
    minHeight: "100vh"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 5
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280"
  },
  addButton: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "14px 24px",
    background: "#10b981",
    color: "white",
    border: "none",
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: 20,
    marginBottom: 30
  },
  statCard: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    padding: 25,
    borderRadius: 16,
    color: "white"
  },
  statIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    background: "rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  statValue: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 5
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.9
  },
  hotelsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    gap: 25
  },
  hotelCard: {
    background: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    border: "1px solid #e5e7eb",
    transition: "all 0.3s",
    cursor: "pointer",
    ":hover": {
      transform: "translateY(-4px)",
      boxShadow: "0 8px 30px rgba(0,0,0,0.12)"
    }
  },
  cardImage: {
    position: "relative",
    height: 200
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  cardBadge: {
    position: "absolute",
    top: 15,
    left: 15,
    background: "rgba(0,0,0,0.7)",
    color: "white",
    padding: "6px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    textTransform: "capitalize"
  },
  cardActions: {
    position: "absolute",
    top: 15,
    right: 15,
    display: "flex",
    gap: 8
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.9)",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#374151",
    transition: "all 0.2s",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
  },
  cardContent: {
    padding: 20
  },
  hotelName: {
    fontSize: 18,
    fontWeight: 600,
    color: "#111827",
    marginBottom: 8
  },
  location: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    color: "#6b7280",
    fontSize: 14,
    marginBottom: 12
  },
  roomInfo: {
    display: "flex",
    gap: 15,
    marginBottom: 10
  },
  roomStat: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 13,
    color: "#4b5563"
  },
  priceRange: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 15,
    fontWeight: 600,
    color: "#059669",
    marginBottom: 12
  },
  amenities: {
    display: "flex",
    gap: 12,
    marginBottom: 12,
    color: "#6b7280"
  },
  contactInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    marginBottom: 10,
    fontSize: 13,
    color: "#4b5563"
  },
  contactItem: {
    display: "flex",
    alignItems: "center",
    gap: 6
  },
  timingInfo: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 15,
    padding: "8px 12px",
    background: "#f3f4f6",
    borderRadius: 8
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTop: "1px solid #e5e7eb"
  },
  bookingsCount: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 13,
    color: "#4b5563"
  },
  statusActive: {
    padding: "4px 10px",
    background: "#d1fae5",
    color: "#065f46",
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600
  },
  statusInactive: {
    padding: "4px 10px",
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600
  },
  emptyState: {
    textAlign: "center",
    padding: "80px 20px",
    background: "#ffffff",
    borderRadius: 16,
    border: "2px dashed #e5e7eb"
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 10
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 30
  },
  emptyButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "14px 30px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer"
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    gap: 20
  },
  spinner: {
    width: 50,
    height: 50,
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000
  },
  modal: {
    background: "#ffffff",
    borderRadius: 16,
    width: "90%",
    maxWidth: 500,
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 20,
    borderBottom: "1px solid #e5e7eb"
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: "#111827",
    flex: 1
  },
  modalClose: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#6b7280"
  },
  modalContent: {
    padding: 20
  },
  modalWarning: {
    fontSize: 14,
    color: "#ef4444",
    marginTop: 10
  },
  modalFooter: {
    display: "flex",
    gap: 10,
    padding: 20,
    borderTop: "1px solid #e5e7eb"
  },
  modalCancel: {
    flex: 1,
    padding: "12px",
    background: "#f3f4f6",
    color: "#374151",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer"
  },
  modalDelete: {
    flex: 1,
    padding: "12px",
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer"
  }
};

// Add keyframe animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);