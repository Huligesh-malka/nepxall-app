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
      const res = await api.get("/owner/bank");

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
      await api.post("/owner/bank", form);
      setMessage("Bank details saved successfully");
      fetchBank();
    } catch (err) {
      setMessage(err.response?.data?.message || "Error saving bank details");
    } finally {
      setSaving(false);
    }
  };

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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        <div className="bg-white rounded-xl shadow-md border overflow-hidden">

          {/* HEADER (FIXED) */}
          <div className="bg-white border-b px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-800">
              Bank Verification
            </h1>
            <p className="text-gray-500 mt-1">
              Complete this step to start approving bookings and receive payments
            </p>
          </div>

          {/* FORM */}
          <div className="px-8 py-6">
            {message && (
              <div
                className={`mb-6 p-3 rounded-md ${
                  message.includes("success")
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <input
                  type="text"
                  name="account_holder_name"
                  value={form.account_holder_name}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-md"
                  placeholder="Account Holder Name"
                  required
                />

                <input
                  type="text"
                  name="account_number"
                  value={form.account_number}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-md"
                  placeholder="Account Number"
                  required
                />

                <input
                  type="text"
                  name="ifsc"
                  value={form.ifsc}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-md"
                  placeholder="IFSC Code"
                  required
                />

                <input
                  type="text"
                  name="bank_name"
                  value={form.bank_name}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-md"
                  placeholder="Bank Name"
                />

                <input
                  type="text"
                  name="branch"
                  value={form.branch}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-md md:col-span-2"
                  placeholder="Branch"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Bank Details"}
              </button>
            </form>
          </div>

          {/* FOOTER */}
          <div className="bg-gray-50 px-8 py-3 border-t text-sm text-gray-500">
            Your bank details are secure and encrypted
          </div>

        </div>
      </div>
    </div>
  );
}