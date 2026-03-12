import React, { useState } from "react";
import api from "../api/api";

const AgreementForm = ({ userId, bookingId }) => {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState({
    user_id: userId || "", // Ensure these are passed from parent or auth context
    booking_id: bookingId || "",
    full_name: "",
    father_name: "",
    dob: "",
    mobile: "",
    email: "",
    occupation: "",
    company_name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    aadhaar_number: "",
    aadhaar_last4: "",
    checkin_date: "",
    agreement_months: "",
    rent: "",
    deposit: "",
    maintenance: ""
  });

  const [files, setFiles] = useState({
    aadhaar_front: null,
    aadhaar_back: null,
    signature: null
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setSuccessMsg("");

    try {
      const data = new FormData();

      // Append all text fields
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });

      // Append files
      Object.keys(files).forEach((key) => {
        if (files[key]) {
          data.append(key, files[key]);
        }
      });

      const res = await api.post("/agreements-form/submit", data, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 300000, // 5 Minutes: Gives enough time for Cloudinary uploads
      });

      setSuccessMsg(res.data.message || "Agreement submitted successfully");

      // Reset Form
      setFormData({
        full_name: "", father_name: "", dob: "", mobile: "", email: "",
        occupation: "", company_name: "", address: "", city: "",
        state: "", pincode: "", aadhaar_number: "", aadhaar_last4: "",
        checkin_date: "", agreement_months: "", rent: "", deposit: "", maintenance: ""
      });
      setFiles({ aadhaar_front: null, aadhaar_back: null, signature: null });

    } catch (error) {
      console.error("Agreement Error:", error);
      alert(error?.response?.data?.message || "Upload failed. Check file sizes.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { padding: "12px", borderRadius: "8px", border: "1px solid #ddd", width: "100%", fontSize: "14px" };
  const fileBox = { border: "1px dashed #bbb", padding: "15px", borderRadius: "10px", textAlign: "center", background: "#fafafa" };
  const grid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" };

  return (
    <div style={{ background: "#f6f8fb", minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ maxWidth: "900px", margin: "auto", background: "#fff", padding: "30px", borderRadius: "12px", boxShadow: "0 5px 25px rgba(0,0,0,0.08)" }}>
        <h2 style={{ marginBottom: "25px", textAlign: "center" }}>Rental Agreement Form</h2>

        {successMsg && (
          <div style={{ background: "#d1fae5", color: "#065f46", padding: "12px", borderRadius: "8px", marginBottom: "20px" }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <h3>Personal Details</h3>
          <div style={grid}>
            <input style={inputStyle} name="full_name" placeholder="Full Name" onChange={handleChange} required />
            <input style={inputStyle} name="father_name" placeholder="Father Name" onChange={handleChange} />
            <input style={inputStyle} type="date" name="dob" onChange={handleChange} />
            <input style={inputStyle} name="mobile" placeholder="Mobile Number" onChange={handleChange} required />
            <input style={inputStyle} name="email" placeholder="Email" onChange={handleChange} />
            <input style={inputStyle} name="occupation" placeholder="Occupation" onChange={handleChange} />
            <input style={inputStyle} name="company_name" placeholder="Company / College" onChange={handleChange} />
            <input style={inputStyle} name="city" placeholder="City" onChange={handleChange} />
            <input style={inputStyle} name="state" placeholder="State" onChange={handleChange} />
            <input style={inputStyle} name="pincode" placeholder="Pincode" onChange={handleChange} />
          </div>

          <br />
          <textarea style={{ ...inputStyle, height: "80px" }} name="address" placeholder="Full Address" onChange={handleChange} />

          <h3 style={{ marginTop: "30px" }}>Aadhaar Verification</h3>
          <div style={grid}>
            <input style={inputStyle} name="aadhaar_number" placeholder="Aadhaar Number" onChange={handleChange} />
            <input style={inputStyle} name="aadhaar_last4" placeholder="Last 4 digits Aadhaar" onChange={handleChange} />
          </div>

          <br />
          <div style={grid}>
            <div style={fileBox}>
              <label>Aadhaar Front</label><br />
              <input type="file" name="aadhaar_front" onChange={handleFileChange} />
            </div>
            <div style={fileBox}>
              <label>Aadhaar Back</label><br />
              <input type="file" name="aadhaar_back" onChange={handleFileChange} />
            </div>
          </div>

          <h3 style={{ marginTop: "30px" }}>Rental Details</h3>
          <div style={grid}>
            <input style={inputStyle} type="date" name="checkin_date" onChange={handleChange} />
            <input style={inputStyle} name="agreement_months" placeholder="Agreement Months" onChange={handleChange} />
            <input style={inputStyle} name="rent" placeholder="Rent Amount" onChange={handleChange} />
            <input style={inputStyle} name="deposit" placeholder="Security Deposit" onChange={handleChange} />
            <input style={inputStyle} name="maintenance" placeholder="Maintenance" onChange={handleChange} />
          </div>

          <h3 style={{ marginTop: "30px" }}>Digital Signature</h3>
          <div style={fileBox}>
            <label>Upload Signature</label><br />
            <input type="file" name="signature" onChange={handleFileChange} />
          </div>

          <br />
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "14px", border: "none", borderRadius: "10px",
              background: loading ? "#999" : "#4f46e5", color: "#fff", fontSize: "16px", fontWeight: "bold"
            }}
          >
            {loading ? "Processing Uploads..." : "Submit Agreement"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AgreementForm;