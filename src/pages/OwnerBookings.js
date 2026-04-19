import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";

const OwnerBank = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    account_number: "",
    ifsc: "",
    account_holder_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadBankDetails();
  }, []);

  const loadBankDetails = async () => {
    try {
      const token = await user.getIdToken();
      const res = await api.get("/owner/bank", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data) {
        setFormData({
          account_number: res.data.account_number || "",
          ifsc: res.data.ifsc || "",
          account_holder_name: res.data.account_holder_name || "",
        });
      }
    } catch (err) {
      // 404 means no bank details yet, that's fine
      if (err.response?.status !== 404) {
        console.error(err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = await user.getIdToken();
      await api.post("/owner/bank", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess("Bank details saved successfully!");
      setTimeout(() => {
        navigate("/owner/bookings");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save bank details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={container}>
      <h2>🏦 Bank Details</h2>
      <p style={subtitle}>Add your bank account to receive payments</p>

      {location.state?.message && (
        <div style={warningBox}>
          {location.state.message}
        </div>
      )}

      {success && <div style={successBox}>{success}</div>}
      {error && <div style={errorBox}>{error}</div>}

      <form onSubmit={handleSubmit} style={form}>
        <div style={inputGroup}>
          <label>Account Holder Name</label>
          <input
            type="text"
            value={formData.account_holder_name}
            onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
            required
            style={input}
            placeholder="Enter account holder name"
          />
        </div>

        <div style={inputGroup}>
          <label>Account Number</label>
          <input
            type="text"
            value={formData.account_number}
            onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
            required
            style={input}
            placeholder="Enter account number"
          />
        </div>

        <div style={inputGroup}>
          <label>IFSC Code</label>
          <input
            type="text"
            value={formData.ifsc}
            onChange={(e) => setFormData({ ...formData, ifsc: e.target.value.toUpperCase() })}
            required
            style={input}
            placeholder="Enter IFSC code"
          />
        </div>

        <button type="submit" disabled={loading} style={button}>
          {loading ? "Saving..." : "Save Bank Details"}
        </button>
      </form>
    </div>
  );
};

export default OwnerBank;

const container = {
  maxWidth: 500,
  margin: "auto",
  padding: 20,
};

const subtitle = {
  color: "#666",
  marginBottom: 20,
};

const warningBox = {
  background: "#fef3c7",
  padding: 12,
  borderRadius: 8,
  marginBottom: 20,
  color: "#92400e",
  border: "1px solid #fde68a",
};

const form = {
  display: "flex",
  flexDirection: "column",
  gap: 20,
};

const inputGroup = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const input = {
  padding: 10,
  border: "1px solid #ddd",
  borderRadius: 6,
  fontSize: 16,
};

const button = {
  padding: 12,
  background: "#16a34a",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontSize: 16,
  cursor: "pointer",
  marginTop: 10,
};

const successBox = {
  background: "#dcfce7",
  color: "#166534",
  padding: 12,
  borderRadius: 8,
  marginBottom: 20,
};

const errorBox = {
  background: "#fee2e2",
  color: "#b91c1c",
  padding: 12,
  borderRadius: 8,
  marginBottom: 20,
};