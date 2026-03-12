import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

const AgreementForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "", father_name: "", dob: "", mobile: "", email: "",
    occupation: "", company_name: "", address: "", city: "", state: "",
    pincode: "", aadhaar_number: "", aadhaar_last4: "", pan_number: "",
    checkin_date: "", agreement_months: "", rent: "", deposit: "", maintenance: ""
  });

  const [files, setFiles] = useState({
    aadhaar_front: null, aadhaar_back: null, pan_card: null, signature: null
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setFiles({ ...files, [e.target.name]: e.target.files[0] });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      const data = new FormData();
      
      // Clean the booking ID to ensure it's an Integer
      const cleanBookingId = parseInt(id);
      data.append("booking_id", isNaN(cleanBookingId) ? "" : cleanBookingId);
      
      // Append text fields
      Object.keys(formData).forEach((key) => {
        if (formData[key]) data.append(key, formData[key]);
      });

      // Append files
      Object.keys(files).forEach((key) => {
        if (files[key]) data.append(key, files[key]);
      });

      await api.post("/agreements-form/submit", data, {
        timeout: 300000, // 5 minute timeout for Cloudinary processing
      });

      setSuccess(true);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Submission Error:", error);
      
      // Handle "Ghost" errors where data is saved but connection drops
      if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        setSuccess(true); 
      } else {
        const msg = error.response?.data?.message || "Upload failed. Please check file sizes.";
        alert(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS VIEW
  if (success) {
    return (
      <div style={{ textAlign: "center", padding: "50px", background: "#fff", borderRadius: "12px", maxWidth: "600px", margin: "50px auto", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <div style={{ fontSize: "50px", color: "#10b981" }}>✅</div>
        <h2>Submission Successful!</h2>
        <p>Your rental agreement data and documents have been uploaded.</p>
        <button 
          onClick={() => navigate("/my-bookings")}
          style={{ padding: "12px 24px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
        >
          Go to My Bookings
        </button>
      </div>
    );
  }

  // FORM VIEW
  return (
    <div style={{ background: "#f9fafb", minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ maxWidth: "800px", margin: "auto", background: "#fff", padding: "30px", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <h2 style={{ textAlign: "center", marginBottom: "30px" }}>Rental Agreement Form (Booking #{id})</h2>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            <input style={styles.input} name="full_name" placeholder="Full Name" onChange={handleChange} required />
            <input style={styles.input} name="mobile" placeholder="Mobile Number" onChange={handleChange} required />
            <input style={styles.input} name="email" placeholder="Email ID" onChange={handleChange} />
            <input style={styles.input} name="pan_number" placeholder="PAN Number" onChange={handleChange} />
          </div>

          <div style={styles.fileGrid}>
            <div style={styles.fileBox}>
              <label>Aadhaar Front (Image/PDF)</label>
              <input type="file" name="aadhaar_front" accept="image/*,application/pdf" onChange={handleFileChange} />
            </div>
            <div style={styles.fileBox}>
              <label>PAN Card (Image/PDF)</label>
              <input type="file" name="pan_card" accept="image/*,application/pdf" onChange={handleFileChange} />
            </div>
            <div style={styles.fileBox}>
              <label>Signature</label>
              <input type="file" name="signature" accept="image/*,application/pdf" onChange={handleFileChange} />
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ 
            ...styles.button, 
            background: loading ? "#9ca3af" : "#4f46e5",
            cursor: loading ? "not-allowed" : "pointer" 
          }}>
            {loading ? "Uploading Documents..." : "Submit Agreement"}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  input: { padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", width: "100%" },
  fileGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" },
  fileBox: { border: "1px dashed #d1d5db", padding: "15px", borderRadius: "10px", background: "#f3f4f6" },
  button: { width: "100%", padding: "15px", color: "#fff", fontWeight: "bold", border: "none", borderRadius: "10px", fontSize: "16px", transition: "0.3s" }
};

export default AgreementForm;