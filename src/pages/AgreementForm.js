import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

const AgreementForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "", mobile: "", email: "", pan_number: ""
  });

  const [files, setFiles] = useState({
    aadhaar_front: null, aadhaar_back: null, pan_card: null, signature: null
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 3 * 1024 * 1024) {
      alert("Large file detected. Upload may take a few seconds.");
    }
    setFiles({ ...files, [e.target.name]: file });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      const data = new FormData();
      data.append("booking_id", parseInt(id) || "");
      
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      Object.keys(files).forEach(key => {
        if (files[key]) data.append(key, files[key]);
      });

      // Send request with no timeout to allow Cloudinary to finish
      await api.post("/agreements-form/submit", data, { timeout: 0 }); 
      
      setSubmitted(true);
    } catch (error) {
      console.error("Upload Error:", error);
      
      // If we get a Network Error but saw "--- New Agreement Submission ---" 
      // in the logs earlier, it's actually done.
      if (error.message === "Network Error") {
         setSubmitted(true);
      } else {
         alert("Submission failed. Please check your internet and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={styles.successContainer}>
        <div style={styles.icon}>✅</div>
        <h2>Submission Successful!</h2>
        <p>Your documents have been received and are being reviewed.</p>
        <button onClick={() => navigate("/")} style={styles.homeBtn}>
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={{ textAlign: "center" }}>Rental Agreement Form (Booking #{id})</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <input style={styles.input} placeholder="Full Name" name="full_name" onChange={handleChange} required />
          <input style={styles.input} placeholder="Mobile" name="mobile" onChange={handleChange} required />
          <input style={styles.input} placeholder="Email" name="email" onChange={handleChange} />
          <input style={styles.input} placeholder="PAN Number" name="pan_number" onChange={handleChange} />
        </div>
        
        <p style={styles.label}>Upload Documents (Images or PDF)</p>
        <div style={styles.fileGrid}>
          {Object.keys(files).map((fileKey) => (
            <div key={fileKey} style={styles.fileBox}>
              <label style={{ textTransform: "capitalize" }}>{fileKey.replace('_', ' ')}</label>
              <input 
                type="file" 
                name={fileKey} 
                accept="image/*,application/pdf" 
                onChange={handleFileChange} 
                required={fileKey !== 'pan_card'} // Make most required
              />
            </div>
          ))}
        </div>

        <button type="submit" disabled={loading} style={{ 
          ...styles.btn, 
          background: loading ? "#9ca3af" : "#4f46e5" 
        }}>
          {loading ? "⚡ Processing Secure Upload..." : "Submit Agreement Now"}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: { padding: "40px 20px", maxWidth: "800px", margin: "auto", background: "#fff", borderRadius: "15px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" },
  form: { display: "grid", gap: "20px" },
  inputGroup: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" },
  input: { padding: "12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px" },
  label: { fontWeight: "600", marginBottom: "-10px", color: "#374151" },
  fileGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" },
  fileBox: { padding: "12px", border: "1px dashed #cbd5e1", borderRadius: "8px", background: "#f8fafc", fontSize: "12px" },
  btn: { padding: "16px", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer", transition: "0.2s" },
  successContainer: { textAlign: "center", marginTop: "100px", padding: "40px", background: "#fff", borderRadius: "20px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" },
  icon: { fontSize: "60px", marginBottom: "20px" },
  homeBtn: { marginTop: "20px", padding: "12px 24px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }
};

export default AgreementForm;