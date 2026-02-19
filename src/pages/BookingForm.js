import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import api from "../api/api";

export default function BookingForm({ onClose }) {
  const { pgId } = useParams();

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    check_in_date: "",
    duration: "6 Months",
    bhk_type: "",
    message: "",
  });

  /* ================= AUTH ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);

        // ✅ Autofill from Firebase
        setForm((prev) => ({
          ...prev,
          full_name: u.displayName || "",
          email: u.email || "",
        }));
      } else {
        setUser(null);
      }
    });

    return unsub;
  }, []);

  /* ================= HANDLE CHANGE ================= */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ================= VALIDATION ================= */
  const validate = () => {
    if (!form.full_name || !form.email || !form.phone) {
      return "Fill all required fields";
    }

    if (!form.check_in_date) {
      return "Select check-in date";
    }

    if (!form.bhk_type) {
      return "Select BHK type";
    }

    return null;
  };

  /* ================= SUBMIT ================= */
  const submitBooking = async () => {
    if (!user) return alert("Please login first");

    const errorMsg = validate();
    if (errorMsg) return alert(errorMsg);

    try {
      setLoading(true);

      await api.post("/bookings", {
        pg_id: Number(pgId),
        ...form,
      });

      alert("✅ Booking request sent");

      onClose?.();
    } catch (err) {
      alert(err.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="booking-modal">
      <h2>🏠 Book Property</h2>

      <input
        name="full_name"
        placeholder="Full Name"
        value={form.full_name}
        onChange={handleChange}
      />

      <input
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
      />

      <input
        name="phone"
        placeholder="Phone Number"
        value={form.phone}
        onChange={handleChange}
      />

      <input
        type="date"
        name="check_in_date"
        value={form.check_in_date}
        onChange={handleChange}
      />

      <select
        name="duration"
        value={form.duration}
        onChange={handleChange}
      >
        <option>3 Months</option>
        <option>6 Months</option>
        <option>12 Months</option>
      </select>

      <select
        name="bhk_type"
        value={form.bhk_type}
        onChange={handleChange}
      >
        <option value="">Select BHK</option>
        <option value="1 BHK">1 BHK</option>
        <option value="2 BHK">2 BHK</option>
      </select>

      <textarea
        name="message"
        placeholder="Additional message (optional)"
        value={form.message}
        onChange={handleChange}
      />

      <button onClick={submitBooking} disabled={loading}>
        {loading ? "Submitting..." : "Submit Booking"}
      </button>
    </div>
  );
}
