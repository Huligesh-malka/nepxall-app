// src/pages/hotels/AddHotel.js

import React, { useState, useEffect } from "react";
import axios from "axios";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000/api/hotels";

export default function AddHotel() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const [hotel, setHotel] = useState({
    hotel_name: "",
    hotel_type: "hotel",
    address: "",
    city: "",
    state: "",
    pincode: "",
    contact_person: "",
    contact_phone: "",
    contact_email: "",
    description: "",
    check_in_time: "14:00",
    check_out_time: "11:00",
    amenities: {
      wifi: false,
      parking: false,
      restaurant: false,
      pool: false,
      gym: false,
      spa: false,
      room_service: false,
      airport_shuttle: false,
      breakfast: false
    }
  });

  const [rooms, setRooms] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentRoom, setCurrentRoom] = useState({
    room_type: "",
    price_per_night: "",
    total_rooms: "",
    max_guests: "",
    amenities: []
  });

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setHotel({ ...hotel, [name]: value });
  };

  const handleAmenityChange = (amenity) => {
    setHotel({
      ...hotel,
      amenities: {
        ...hotel.amenities,
        [amenity]: !hotel.amenities[amenity]
      }
    });
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    setPhotos(files);
    setPreview(files.map((f) => URL.createObjectURL(f)));
  };

  // Room management
  const handleRoomInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentRoom({ ...currentRoom, [name]: value });
  };

  const addRoom = () => {
    if (!currentRoom.room_type || !currentRoom.price_per_night || !currentRoom.total_rooms) {
      alert("Please fill all room details");
      return;
    }

    // FIXED: Removed bed_type and available_rooms
    setRooms([
      ...rooms,
      {
        room_type: currentRoom.room_type,
        price_per_night: currentRoom.price_per_night,
        total_rooms: currentRoom.total_rooms,
        max_guests: currentRoom.max_guests || 2,
        amenities: currentRoom.amenities,
        id: Date.now()
      }
    ]);

    // Reset form
    setCurrentRoom({
      room_type: "",
      price_per_night: "",
      total_rooms: "",
      max_guests: "",
      amenities: []
    });
  };

  const removeRoom = (id) => setRooms(rooms.filter(room => room.id !== id));

  // Validation
  const validateForm = () => {
    if (!hotel.hotel_name) return "Hotel name is required";
    if (!hotel.address) return "Address is required";
    if (!hotel.city) return "City is required";
    if (!hotel.contact_person) return "Contact person is required";
    if (!hotel.contact_phone) return "Contact phone is required";
    if (rooms.length === 0) return "Add at least one room type";
    if (photos.length === 0) return "Upload at least one photo";
    return null;
  };

  const submitHotel = async () => {
    try {
      if (!user) return alert("Login required");

      const validationError = validateForm();
      if (validationError) {
        alert(validationError);
        return;
      }

      setLoading(true);

      const token = await user.getIdToken();
      const formData = new FormData();

      // Append hotel details
      Object.entries(hotel).forEach(([key, value]) => {
        if (key === 'amenities') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      });

      // Append rooms - FIXED: Remove id field and ensure no bed_type
      const cleanedRooms = rooms.map(room => {
        const { id, ...roomData } = room; // Remove the id field
        return roomData;
      });
      formData.append("rooms", JSON.stringify(cleanedRooms));

      // Append photos
      photos.forEach((p) => formData.append("photos", p));

      const response = await axios.post(API_BASE, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      if (response.data.success) {
        alert("✅ Hotel Added Successfully");
        navigate("/owner/hotels");
      }

    } catch (err) {
      console.error(err);
      alert("Error adding hotel: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🏨 Add New Hotel</h1>

      {/* Basic Information */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Basic Information</h2>
        <div style={styles.grid}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Hotel Name *</label>
            <input
              name="hotel_name"
              placeholder="e.g., Grand Palace Hotel"
              value={hotel.hotel_name}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Hotel Type *</label>
            <select name="hotel_type" value={hotel.hotel_type} onChange={handleChange} style={styles.input}>
              <option value="hotel">Hotel</option>
              <option value="resort">Resort</option>
              <option value="hostel">Hostel</option>
              <option value="homestay">Homestay</option>
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>City *</label>
            <input
              name="city"
              placeholder="e.g., Mumbai"
              value={hotel.city}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>State</label>
            <input
              name="state"
              placeholder="e.g., Maharashtra"
              value={hotel.state}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Pincode</label>
            <input
              name="pincode"
              placeholder="e.g., 400001"
              value={hotel.pincode}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={{ ...styles.inputGroup, gridColumn: "span 2" }}>
            <label style={styles.label}>Address *</label>
            <input
              name="address"
              placeholder="Full address with street, landmark..."
              value={hotel.address}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Contact Information</h2>
        <div style={styles.grid}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Contact Person *</label>
            <input
              name="contact_person"
              placeholder="Manager/Owner Name"
              value={hotel.contact_person}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Phone Number *</label>
            <input
              name="contact_phone"
              placeholder="10-digit mobile number"
              value={hotel.contact_phone}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              name="contact_email"
              type="email"
              placeholder="hotel@example.com"
              value={hotel.contact_email}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
        </div>
      </div>

      {/* Check-in/out Times */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Check-in/out Details</h2>
        <div style={styles.grid}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Check-in Time</label>
            <input
              type="time"
              name="check_in_time"
              value={hotel.check_in_time}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Check-out Time</label>
            <input
              type="time"
              name="check_out_time"
              value={hotel.check_out_time}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
        </div>
      </div>

      {/* Hotel Amenities */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Hotel Amenities</h2>
        <div style={styles.amenitiesGrid}>
          {[
            { key: 'wifi', label: 'WiFi', icon: '📶' },
            { key: 'parking', label: 'Parking', icon: '🚗' },
            { key: 'restaurant', label: 'Restaurant', icon: '🍽️' },
            { key: 'pool', label: 'Swimming Pool', icon: '🏊' },
            { key: 'gym', label: 'Gym/Fitness', icon: '💪' },
            { key: 'spa', label: 'Spa', icon: '💆' },
            { key: 'room_service', label: 'Room Service', icon: '🛎️' },
            { key: 'airport_shuttle', label: 'Airport Shuttle', icon: '🚌' },
            { key: 'breakfast', label: 'Breakfast Included', icon: '🥐' }
          ].map((amenity) => (
            <label key={amenity.key} style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={hotel.amenities[amenity.key]}
                onChange={() => handleAmenityChange(amenity.key)}
                style={styles.checkbox}
              />
              {amenity.icon} {amenity.label}
            </label>
          ))}
        </div>
      </div>

      {/* Room Types */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Room Types *</h2>
        <p style={styles.note}>Add at least one room type</p>

        {/* Room Form */}
        <div style={styles.roomForm}>
          <div style={styles.grid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Room Type</label>
              <select
                name="room_type"
                value={currentRoom.room_type}
                onChange={handleRoomInputChange}
                style={styles.input}
              >
                <option value="">Select Type</option>
                <option value="standard">Standard</option>
                <option value="deluxe">Deluxe</option>
                <option value="suite">Suite</option>
                <option value="executive">Executive</option>
                <option value="family">Family Room</option>
                <option value="dormitory">Dormitory</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Price/Night (₹)</label>
              <input
                type="number"
                name="price_per_night"
                placeholder="e.g., 5000"
                value={currentRoom.price_per_night}
                onChange={handleRoomInputChange}
                style={styles.input}
                min="0"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Total Rooms</label>
              <input
                type="number"
                name="total_rooms"
                placeholder="e.g., 10"
                value={currentRoom.total_rooms}
                onChange={handleRoomInputChange}
                style={styles.input}
                min="1"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Max Guests</label>
              <input
                type="number"
                name="max_guests"
                placeholder="e.g., 2"
                value={currentRoom.max_guests}
                onChange={handleRoomInputChange}
                style={styles.input}
                min="1"
              />
            </div>
          </div>

          <button onClick={addRoom} style={styles.addRoomBtn}>
            ➕ Add This Room
          </button>
        </div>

        {/* Room List */}
        {rooms.length > 0 && (
          <div style={styles.roomList}>
            <h3 style={styles.subTitle}>Added Rooms:</h3>
            <div style={styles.table}>
              <div style={styles.tableHeader}>
                <span>Room Type</span>
                <span>Price/Night</span>
                <span>Total Rooms</span>
                <span>Max Guests</span>
                <span>Action</span>
              </div>
              {rooms.map((room) => (
                <div key={room.id} style={styles.tableRow}>
                  <span>{room.room_type}</span>
                  <span>₹{room.price_per_night}</span>
                  <span>{room.total_rooms}</span>
                  <span>{room.max_guests}</span>
                  <span>
                    <button onClick={() => removeRoom(room.id)} style={styles.removeBtn}>
                      ✕
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Description</h2>
        <textarea
          name="description"
          placeholder="Describe your hotel, amenities, nearby attractions, etc..."
          value={hotel.description}
          onChange={handleChange}
          style={styles.textarea}
          rows="5"
        />
      </div>

      {/* Photos */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Hotel Photos *</h2>
        <p style={styles.note}>Upload at least 1 photo. Maximum 10 photos allowed.</p>

        <div style={styles.fileUpload}>
          <label htmlFor="photo-upload" style={styles.fileUploadLabel}>
            📁 Choose Photos
          </label>
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoChange}
            style={styles.fileInput}
          />
        </div>

        {preview.length > 0 && (
          <div style={styles.previewGrid}>
            {preview.map((img, i) => (
              <div key={i} style={styles.previewItem}>
                <img src={img} alt={`Preview ${i}`} style={styles.previewImg} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Buttons */}
      <div style={styles.buttonGroup}>
        <button
          onClick={() => navigate("/owner/hotels")}
          style={styles.cancelBtn}
        >
          Cancel
        </button>
        <button
          onClick={submitHotel}
          disabled={loading}
          style={{
            ...styles.submitBtn,
            ...(loading ? styles.submitBtnDisabled : {})
          }}
        >
          {loading ? "Adding Hotel..." : "✅ Add Hotel"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: 30,
    background: "#f8fafc",
    minHeight: "100vh"
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 30,
    textAlign: "center"
  },
  section: {
    background: "#ffffff",
    borderRadius: 16,
    padding: 25,
    marginBottom: 25,
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    border: "1px solid #e5e7eb"
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottom: "2px solid #e5e7eb"
  },
  subTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "#4b5563",
    marginBottom: 15
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: 15
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column"
  },
  label: {
    fontSize: 14,
    fontWeight: 500,
    color: "#374151",
    marginBottom: 5
  },
  input: {
    padding: "12px 16px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    transition: "all 0.2s",
    outline: "none",
    ":focus": {
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 3px rgba(59,130,246,0.1)"
    }
  },
  textarea: {
    padding: "12px 16px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    width: "100%",
    resize: "vertical",
    fontFamily: "inherit"
  },
  note: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 15,
    fontStyle: "italic"
  },
  amenitiesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 12
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 15px",
    background: "#f9fafb",
    borderRadius: 8,
    fontSize: 14,
    color: "#374151",
    cursor: "pointer",
    border: "1px solid #e5e7eb"
  },
  checkbox: {
    width: 18,
    height: 18,
    cursor: "pointer"
  },
  roomForm: {
    background: "#f9fafb",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20
  },
  addRoomBtn: {
    marginTop: 15,
    padding: "12px 20px",
    background: "#10b981",
    color: "white",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s"
  },
  roomList: {
    marginTop: 20
  },
  table: {
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    overflow: "hidden"
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr 0.5fr",
    background: "#f3f4f6",
    padding: "12px 15px",
    fontWeight: 600,
    fontSize: 14,
    color: "#374151",
    borderBottom: "2px solid #e5e7eb"
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr 0.5fr",
    padding: "12px 15px",
    fontSize: 14,
    color: "#4b5563",
    borderBottom: "1px solid #e5e7eb",
    alignItems: "center"
  },
  removeBtn: {
    background: "#ef4444",
    color: "white",
    border: "none",
    width: 30,
    height: 30,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: 16
  },
  fileUpload: {
    marginBottom: 15
  },
  fileUploadLabel: {
    display: "inline-block",
    padding: "12px 24px",
    background: "#3b82f6",
    color: "white",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s"
  },
  fileInput: {
    display: "none"
  },
  previewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: 15,
    marginTop: 15
  },
  previewItem: {
    borderRadius: 8,
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
  },
  previewImg: {
    width: "100%",
    height: 120,
    objectFit: "cover"
  },
  buttonGroup: {
    display: "flex",
    gap: 15,
    marginTop: 30
  },
  cancelBtn: {
    flex: 1,
    padding: "16px",
    background: "#6b7280",
    color: "white",
    border: "none",
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer"
  },
  submitBtn: {
    flex: 2,
    padding: "16px",
    background: "#10b981",
    color: "white",
    border: "none",
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer"
  },
  submitBtnDisabled: {
    opacity: 0.6,
    cursor: "not-allowed"
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    fontSize: 18,
    color: "#6b7280"
  }
};