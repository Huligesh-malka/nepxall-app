import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../api/api";

const VisitSchedulePage = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const location = useLocation();
  const isEditMode = location.pathname.includes("/edit");
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [formData, setFormData] = useState({
    visit_date: "",
    visit_time: "",
    preferred_time: "morning",
    notes: "",
    contact_number: ""
  });

  const [booking, setBooking] = useState(location.state?.booking || null);

  // Load existing schedule if in edit mode
  useEffect(() => {
    if (isEditMode && location.state?.schedule) {
      const schedule = location.state.schedule;
      setFormData({
        visit_date: schedule.visit_date ? schedule.visit_date.split('T')[0] : "",
        visit_time: schedule.visit_time || "",
        preferred_time: schedule.preferred_time || "morning",
        notes: schedule.notes || "",
        contact_number: schedule.contact_number || ""
      });
    } else if (!booking && bookingId) {
      loadBookingDetails();
    }
  }, [isEditMode, location.state, bookingId]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/bookings/${bookingId}`);
      setBooking(res.data);
    } catch (err) {
      setError("Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!formData.visit_date) {
      setError("Please select a visit date");
      return;
    }

    const selectedDate = new Date(formData.visit_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setError("Visit date cannot be in the past");
      return;
    }

    if (!formData.visit_time && formData.preferred_time === "specific") {
      setError("Please select a visit time");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        booking_id: parseInt(bookingId),
        visit_date: formData.visit_date,
        visit_time: formData.visit_time || null,
        preferred_time: formData.preferred_time,
        notes: formData.notes,
        contact_number: formData.contact_number || booking?.phone
      };

      if (isEditMode && location.state?.schedule) {
        // Update existing schedule
        await api.put(`/visit-schedules/${location.state.schedule.id}`, payload);
        setSuccess("Visit schedule updated successfully!");
      } else {
        // Create new schedule
        await api.post("/visit-schedules", payload);
        setSuccess("Visit schedule applied successfully!");
      }

      // Redirect back to booking history after 2 seconds
      setTimeout(() => {
        navigate("/user/bookings");
      }, 2000);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to submit visit schedule");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button 
          onClick={() => navigate("/user/bookings")} 
          style={styles.backButton}
        >
          ← Back to Bookings
        </button>
        <h2 style={styles.title}>
          {isEditMode ? "✏️ Edit Visit Schedule" : "📅 Apply for Visit Schedule"}
        </h2>
      </div>

      {booking && (
        <div style={styles.bookingCard}>
          <h3 style={styles.bookingTitle}>{booking.pg_name}</h3>
          <p><strong>Room Type:</strong> {booking.room_type}</p>
          <p><strong>Check-in Date:</strong> {new Date(booking.check_in_date).toDateString()}</p>
        </div>
      )}

      {error && (
        <div style={styles.errorMessage}>
          {error}
        </div>
      )}

      {success && (
        <div style={styles.successMessage}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Visit Date *
          </label>
          <input
            type="date"
            name="visit_date"
            value={formData.visit_date}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            style={styles.input}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            Preferred Time *
          </label>
          <select
            name="preferred_time"
            value={formData.preferred_time}
            onChange={handleChange}
            style={styles.select}
          >
            <option value="morning">Morning (9 AM - 12 PM)</option>
            <option value="afternoon">Afternoon (12 PM - 3 PM)</option>
            <option value="evening">Evening (3 PM - 6 PM)</option>
            <option value="specific">Specific Time</option>
          </select>
        </div>

        {formData.preferred_time === "specific" && (
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Specific Time *
            </label>
            <input
              type="time"
              name="visit_time"
              value={formData.visit_time}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>
        )}

        <div style={styles.formGroup}>
          <label style={styles.label}>
            Contact Number
          </label>
          <input
            type="tel"
            name="contact_number"
            value={formData.contact_number}
            onChange={handleChange}
            placeholder="Your contact number"
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            Additional Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Any specific requirements or questions..."
            style={styles.textarea}
            rows="4"
          />
        </div>

        <div style={styles.infoBox}>
          <p style={styles.infoText}>
            <strong>Note:</strong> Your visit request will be sent to the PG owner for approval. 
            You'll be notified once they confirm the schedule.
          </p>
        </div>

        <div style={styles.buttonGroup}>
          <button
            type="button"
            onClick={() => navigate("/user/bookings")}
            style={styles.cancelButton}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{
              ...styles.submitButton,
              opacity: submitting ? 0.7 : 1
            }}
          >
            {submitting 
              ? "Submitting..." 
              : isEditMode 
                ? "Update Schedule" 
                : "Submit Request"
            }
          </button>
        </div>
      </form>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "600px",
    margin: "40px auto",
    padding: "20px",
    backgroundColor: "#fff",
    borderRadius: "16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
  },
  header: {
    marginBottom: "24px"
  },
  backButton: {
    background: "none",
    border: "none",
    color: "#2563eb",
    cursor: "pointer",
    fontSize: "14px",
    padding: "8px 0",
    marginBottom: "10px"
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: "10px 0"
  },
  bookingCard: {
    backgroundColor: "#f3f4f6",
    padding: "16px",
    borderRadius: "12px",
    marginBottom: "24px"
  },
  bookingTitle: {
    margin: "0 0 10px 0",
    color: "#111827"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  label: {
    fontWeight: "600",
    color: "#374151",
    fontSize: "14px"
  },
  input: {
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s",
    ':focus': {
      borderColor: "#2563eb"
    }
  },
  select: {
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    backgroundColor: "#fff"
  },
  textarea: {
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    resize: "vertical",
    fontFamily: "inherit"
  },
  infoBox: {
    backgroundColor: "#eff6ff",
    padding: "16px",
    borderRadius: "8px",
    border: "1px solid #bfdbfe"
  },
  infoText: {
    margin: 0,
    color: "#1e40af",
    fontSize: "14px",
    lineHeight: "1.5"
  },
  buttonGroup: {
    display: "flex",
    gap: "12px",
    marginTop: "16px"
  },
  cancelButton: {
    flex: 1,
    padding: "12px",
    backgroundColor: "#f3f4f6",
    color: "#374151",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px"
  },
  submitButton: {
    flex: 2,
    padding: "12px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
    transition: "background 0.2s",
    ':hover': {
      backgroundColor: "#1d4ed8"
    }
  },
  errorMessage: {
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "20px",
    border: "1px solid #fecaca"
  },
  successMessage: {
    backgroundColor: "#dcfce7",
    color: "#16a34a",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "20px",
    border: "1px solid #bbf7d0"
  }
};

export default VisitSchedulePage;