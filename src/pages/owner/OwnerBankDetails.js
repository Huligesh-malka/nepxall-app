import React, { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Box, CircularProgress } from "@mui/material";
import api from "../../api/api";

export default function OwnerBankDetails() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();

  const [form, setForm] = useState({
    account_holder_name: "",
    account_number: "",
    ifsc: "",
    bank_name: "",
    branch: ""
  });

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchBank = async () => {
    setPageLoading(true);
    setMessage("");

    try {
      const token = await user.getIdToken();

      const res = await api.get("/owner/bank", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data) {
        setForm({
          account_holder_name: res.data.account_holder_name || "",
          account_number: res.data.account_number || "",
          ifsc: res.data.ifsc || "",
          bank_name: res.data.bank_name || "",
          branch: res.data.branch || ""
        });
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        setMessage("Failed to load bank details");
      }
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }

    if (user && role === "owner") {
      fetchBank();
    }
  }, [user, role, authLoading, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const token = await user.getIdToken();

      await api.post("/owner/bank", form, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setMessage("Bank details saved successfully");
      fetchBank();
    } catch (err) {
      setMessage(err.response?.data?.message || "Error saving bank details");
    } finally {
      setSaving(false);
    }
  };

  /* ================= LOADING ================= */
  if (authLoading || pageLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role !== "owner") return <Navigate to="/" replace />;

  return (
    <div style={{
      padding: "24px",
      maxWidth: "800px",
      margin: "0 auto"
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        border: "1px solid #eee",
        overflow: "hidden"
      }}>

        {/* HEADER */}
        <div style={{
          borderBottom: "1px solid #eee",
          padding: "20px"
        }}>
          <h2 style={{ margin: 0 }}>Bank Verification</h2>
          <p style={{ color: "#666", marginTop: "6px" }}>
            Complete this step to receive payments
          </p>
        </div>

        {/* FORM */}
        <div style={{ padding: "20px" }}>
          {message && (
            <div style={{
              marginBottom: "16px",
              padding: "10px",
              borderRadius: "6px",
              background: message.includes("success") ? "#dcfce7" : "#fee2e2",
              color: message.includes("success") ? "#166534" : "#991b1b"
            }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px"
            }}>

              <input
                name="account_holder_name"
                value={form.account_holder_name}
                onChange={handleChange}
                placeholder="Account Holder Name"
                style={inputStyle}
                required
              />

              <input
                name="account_number"
                value={form.account_number}
                onChange={handleChange}
                placeholder="Account Number"
                style={inputStyle}
                required
              />

              <input
                name="ifsc"
                value={form.ifsc}
                onChange={handleChange}
                placeholder="IFSC Code"
                style={inputStyle}
                required
              />

              <input
                name="bank_name"
                value={form.bank_name}
                onChange={handleChange}
                placeholder="Bank Name"
                style={inputStyle}
              />

              <input
                name="branch"
                value={form.branch}
                onChange={handleChange}
                placeholder="Branch"
                style={{ ...inputStyle, gridColumn: "span 2" }}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              style={buttonStyle}
            >
              {saving ? "Saving..." : "Save Bank Details"}
            </button>
          </form>
        </div>

        {/* FOOTER */}
        <div style={{
          borderTop: "1px solid #eee",
          padding: "12px",
          fontSize: "12px",
          color: "#777"
        }}>
          Your bank details are secure
        </div>

      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const inputStyle = {
  padding: "12px",
  border: "1px solid #ddd",
  borderRadius: "6px",
  width: "100%"
};

const buttonStyle = {
  marginTop: "16px",
  width: "100%",
  padding: "12px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer"
};