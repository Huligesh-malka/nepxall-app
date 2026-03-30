import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

const AgreementForm = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [existingAgreement, setExistingAgreement] = useState(null);

  const [formData, setFormData] = useState({
    full_name: "",
    father_name: "",
    mobile: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    aadhaar_last4: "",
    pan_number: "",
    checkin_date: "",
    agreement_months: "11",
    rent: "",
    deposit: "",
    maintenance: "0",
  });

  const [signature, setSignature] = useState(""); // ✅ base64

  /* ================= CHECK STATUS ================= */
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await api.get(`/agreements-form/status/${bookingId}`);
        if (res.data.exists) {
          setExistingAgreement(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    };
    if (bookingId) checkStatus();
  }, [bookingId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  /* ================= HANDLE SIGNATURE (BASE64) ================= */
  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSignature(reader.result); // ✅ base64 string
    };
    reader.readAsDataURL(file);
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const userId = localStorage.getItem("user_id") || localStorage.getItem("userId");

    if (!userId) return alert("Login required");
    if (!signature) return alert("Signature required");

    setLoading(true);

    try {
      const res = await api.post("/agreements-form/submit", {
        ...formData,
        user_id: userId,
        booking_id: bookingId,
        signature // ✅ base64
      });

      if (res.data.success) {
        alert("✅ Submitted Successfully!");
        window.location.reload();
      }

    } catch (err) {
      console.error(err);
      alert("Error submitting form");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div style={{ textAlign: "center", marginTop: "100px" }}>Loading...</div>;

  /* ================= WAIT SCREEN ================= */
  if (existingAgreement) {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <h2>⏳ Agreement Submitted</h2>
        <p>Status: {existingAgreement.agreement_status}</p>

        <button onClick={() => navigate("/my-bookings")}>
          Back to Bookings
        </button>
      </div>
    );
  }

  /* ================= FORM ================= */
  return (
    <div style={{ maxWidth: "800px", margin: "30px auto" }}>
      <h2>Rental Agreement</h2>

      <form onSubmit={handleSubmit}>
        <input name="full_name" placeholder="Full Name" onChange={handleChange} required />
        <input name="father_name" placeholder="Father Name" onChange={handleChange} required />
        <input name="mobile" placeholder="Mobile" onChange={handleChange} required />
        <input name="email" placeholder="Email" onChange={handleChange} required />
        <input name="address" placeholder="Address" onChange={handleChange} required />
        <input name="city" placeholder="City" onChange={handleChange} required />
        <input name="state" placeholder="State" onChange={handleChange} required />
        <input name="pincode" placeholder="Pincode" onChange={handleChange} required />
        <input name="aadhaar_last4" placeholder="Aadhaar Last 4" onChange={handleChange} required />
        <input name="pan_number" placeholder="PAN" onChange={handleChange} required />

        <input name="checkin_date" type="date" onChange={handleChange} required />
        <input name="agreement_months" type="number" defaultValue="11" onChange={handleChange} />
        <input name="rent" type="number" placeholder="Rent" onChange={handleChange} />
        <input name="deposit" type="number" placeholder="Deposit" onChange={handleChange} />

        {/* ✅ SIGNATURE UPLOAD */}
        <div style={{ marginTop: "20px" }}>
          <label>Upload Signature</label>
          <input type="file" accept="image/*" onChange={handleSignatureUpload} required />
        </div>

        {/* PREVIEW */}
        {signature && (
          <img src={signature} alt="signature preview" style={{ width: "200px", marginTop: "10px" }} />
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
};

export default AgreementForm;