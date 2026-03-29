import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

const AgreementForm = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [existingAgreement, setExistingAgreement] = useState(null);

  const [signature, setSignature] = useState(null);
  const [tenantSignature, setTenantSignature] = useState(null);
  const [signLoading, setSignLoading] = useState(false);

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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /* ================= SUBMIT FORM ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const userId = localStorage.getItem("user_id");
    if (!userId) return alert("Login required");
    if (!signature) return alert("Signature required");

    const data = new FormData();

    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key]);
    });

    data.append("user_id", userId);
    data.append("booking_id", bookingId);
    data.append("signature", signature);

    try {
      setLoading(true);

      const res = await api.post("/agreements-form/submit", data);

      if (res.data.success) {
        alert("Submitted ✅");
        window.location.reload();
      }
    } catch {
      alert("Error ❌");
    } finally {
      setLoading(false);
    }
  };

  /* ================= TENANT FINAL SIGN ================= */
  const handleTenantSign = async () => {
    if (!tenantSignature) return alert("Upload signature");

    try {
      setSignLoading(true);

      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64 = reader.result;

        const res = await api.post("/agreements-form/tenant/sign", {
          booking_id: bookingId,
          tenant_signature: base64
        });

        if (res.data.success) {
          alert("Agreement Signed ✅");
          window.open(res.data.url, "_blank");
          window.location.reload();
        }
      };

      reader.readAsDataURL(tenantSignature);

    } catch (err) {
      console.error(err);
      alert("Failed ❌");
    } finally {
      setSignLoading(false);
    }
  };

  if (fetching) {
    return <div style={{ textAlign: "center", marginTop: 100 }}>Loading...</div>;
  }

  /* ================= STATUS UI ================= */
  if (existingAgreement) {
    return (
      <div style={{ maxWidth: 600, margin: "50px auto", textAlign: "center" }}>

        <h2>Status: {existingAgreement.agreement_status}</h2>

        {/* PENDING */}
        {existingAgreement.agreement_status === "pending" && (
          <p>Waiting for owner...</p>
        )}

        {/* OWNER SIGNED */}
        {existingAgreement.agreement_status === "owner_signed" && (
          <>
            <p>Owner signed ✅</p>

            <button
              onClick={() => window.open(existingAgreement.signed_pdf)}
            >
              View Agreement
            </button>

            <div style={{ marginTop: 20 }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setTenantSignature(e.target.files[0])}
              />
            </div>

            <button onClick={handleTenantSign}>
              {signLoading ? "Signing..." : "Sign Agreement"}
            </button>
          </>
        )}

        {/* COMPLETED */}
        {existingAgreement.agreement_status === "completed" && (
          <>
            <p>Fully Signed ✅</p>

            <button
              onClick={() => window.open(existingAgreement.signed_pdf)}
            >
              View Final Agreement
            </button>
          </>
        )}

      </div>
    );
  }

  /* ================= FORM ================= */
  return (
    <div style={{ maxWidth: 800, margin: "30px auto" }}>
      <h2>Agreement Form</h2>

      <form onSubmit={handleSubmit}>
        <input name="full_name" placeholder="Full Name" onChange={handleChange} required />
        <input name="father_name" placeholder="Father Name" onChange={handleChange} required />
        <input name="mobile" placeholder="Mobile" onChange={handleChange} required />
        <input name="email" placeholder="Email" onChange={handleChange} required />
        <textarea name="address" placeholder="Address" onChange={handleChange} required />

        <input type="file" onChange={(e) => setSignature(e.target.files[0])} required />

        <button type="submit">
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
};

export default AgreementForm;