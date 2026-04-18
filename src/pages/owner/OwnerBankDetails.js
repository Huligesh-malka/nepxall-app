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
  const [hasBank, setHasBank] = useState(false); // ✅ Simple flag for view/form

  const fetchBank = async () => {
    setPageLoading(true);
    setMessage("");

    try {
      const res = await api.get("/owner/bank");

      // ✅ Check if bank data exists
      if (res.data?.data) {
        const bank = res.data.data;
        
        setForm({
          account_holder_name: bank.account_holder_name || "",
          account_number: bank.account_number || "",
          ifsc: bank.ifsc || "",
          bank_name: bank.bank_name || "",
          branch: bank.branch || ""
        });
        
        setHasBank(true); // ✅ Show read-only view
      } else {
        // No bank details found, show form
        setHasBank(false);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        setMessage("Failed to load bank details");
      }
      setHasBank(false); // Show form on error/no data
      console.log("GET BANK ERROR:", err.response?.data || err.message);
    } finally {
      setPageLoading(false);
    }
  };

  /* ================= AUTH + LOAD ================= */
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
      
      // ✅ Switch to view mode after successful save
      setHasBank(true);
      
      // Refresh to get masked data from backend
      await fetchBank();
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Error saving bank details"
      );
      console.log("SAVE BANK ERROR:", err.response?.data || err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ================= PROTECTION ================= */
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-10">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-lg p-4 rounded-2xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Bank Verification</h1>
                <p className="text-blue-100 mt-2">
                  {!hasBank 
                    ? "Complete this step to start approving bookings and receive payments"
                    : "Your bank details are verified and secure"}
                </p>
              </div>
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`mx-8 mt-8 p-4 rounded-xl flex items-center space-x-3 ${
              message.includes("successfully") 
                ? "bg-green-50 text-green-800 border border-green-200" 
                : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              <span className="text-xl">
                {message.includes("successfully") ? "✅" : "❌"}
              </span>
              <span className="font-medium">{message}</span>
            </div>
          )}

          {/* ✅ VIEW ONLY MODE - No Edit Button */}
          {hasBank ? (
            <div className="p-8">
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      🏦 Bank Details Verified
                    </h2>
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                      Verified
                    </span>
                  </div>
                </div>

                <div className="space-y-4 text-gray-700">
                  <div className="flex items-center space-x-3 p-3 bg-white rounded-xl">
                    <span className="text-2xl">👤</span>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Account Holder</p>
                      <p className="font-semibold text-gray-800">{form.account_holder_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-white rounded-xl">
                    <span className="text-2xl">🏦</span>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Bank Name</p>
                      <p className="font-semibold text-gray-800">{form.bank_name || "Not provided"}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-white rounded-xl">
                    <span className="text-2xl">🔢</span>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Account Number</p>
                      <p className="font-mono font-semibold text-gray-800">{form.account_number}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-white rounded-xl">
                    <span className="text-2xl">🔐</span>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">IFSC Code</p>
                      <p className="font-mono font-semibold text-gray-800">{form.ifsc}</p>
                    </div>
                  </div>

                  {form.branch && (
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-xl">
                      <span className="text-2xl">📍</span>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Branch</p>
                        <p className="font-semibold text-gray-800">{form.branch}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 🔒 No Edit Button - Just a notice */}
                <div className="mt-6 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                  <p className="text-sm text-yellow-800 flex items-center space-x-2">
                    <span className="text-lg">🔒</span>
                    <span>Bank details are encrypted and cannot be modified after verification</span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* ✅ ONLY FIRST TIME FORM - No Cancel/Edit buttons */
            <div className="px-8 py-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Account Holder Name *
                    </label>
                    <input
                      type="text"
                      name="account_holder_name"
                      value={form.account_holder_name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none"
                      placeholder="Enter account holder name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Account Number *
                    </label>
                    <input
                      type="text"
                      name="account_number"
                      value={form.account_number}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none"
                      placeholder="Enter account number"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      IFSC Code *
                    </label>
                    <input
                      type="text"
                      name="ifsc"
                      value={form.ifsc}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none"
                      placeholder="Enter IFSC code"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      name="bank_name"
                      value={form.bank_name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none"
                      placeholder="Enter bank name"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Branch
                    </label>
                    <input
                      type="text"
                      name="branch"
                      value={form.branch}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none"
                      placeholder="Enter branch name"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {saving ? (
                      <span className="flex items-center justify-center space-x-3">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Saving...</span>
                      </span>
                    ) : (
                      "Save & Complete Verification"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Footer Note */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Your bank details are encrypted and secure</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}