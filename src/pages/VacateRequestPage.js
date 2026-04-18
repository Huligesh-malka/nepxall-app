import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronDown,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  CreditCard,
  Home,
  Calendar,
  MessageSquare,
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
  RefreshCw,
  User,
  Building,
  DollarSign,
  Mail,
  Phone,
  MapPin,
  X,
  Menu,
  Info,
  ThumbsUp,
  ThumbsDown,
  Send,
} from "lucide-react";
import api from "../api/api";

// ============================================================
// TYPES & CONSTANTS
// ============================================================
const REFUND_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  COMPLETED: "completed",
  REJECTED: "rejected",
};

const REFUND_STAGES = [
  { id: "request", label: "Request Submitted", icon: Clock },
  { id: "review", label: "Owner Review", icon: Shield },
  { id: "approval", label: "Approval", icon: CheckCircle },
  { id: "disbursal", label: "Refund Disbursed", icon: DollarSign },
];

// ============================================================
// MOBILE-OPTIMIZED MAIN COMPONENT
// ============================================================
const VacateRequestPage = ({ onSuccess, onCancel }) => {
  // State
  const [stays, setStays] = useState([]);
  const [selectedStayId, setSelectedStayId] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    vacateDate: "",
    vacateReason: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStays, setLoadingStays] = useState(true);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [activeTab, setActiveTab] = useState("form"); // "status" or "form" - default to form
  const [showMobileForm, setShowMobileForm] = useState(true); // Show form by default
  const [hasSubmittedRequest, setHasSubmittedRequest] = useState(false); // Track if user has submitted a vacate request

  // Load bookings
  const loadBookings = async () => {
    try {
      setLoadingStays(true);
      const res = await api.get("/bookings/user/active-stay");
      setStays(res.data || []);
    } catch (err) {
      console.error("Error loading bookings:", err);
    } finally {
      setLoadingStays(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  // Filter stays based on search
  const filteredStays = stays.filter((stay) =>
    `${stay.pg_name} Room ${stay.room_no}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedStay = stays.find((s) => s.id === parseInt(selectedStayId));
  const isJoined = selectedStay?.is_joined > 0;
  const depositRefundStatus = (selectedStay?.deposit_refund_status || "").toLowerCase();
  const refundStatus = depositRefundStatus;

  // Check if user has an active/pending/completed refund request
  useEffect(() => {
    if (selectedStay && refundStatus && refundStatus !== "rejected") {
      setHasSubmittedRequest(true);
      setActiveTab("status");
      setShowMobileForm(false);
    } else {
      setHasSubmittedRequest(false);
      setActiveTab("form");
      setShowMobileForm(true);
    }
  }, [selectedStay, refundStatus]);

  // Get current stage index for progress
  const getCurrentStageIndex = () => {
    switch (refundStatus) {
      case REFUND_STATUS.PENDING:
        return 1;
      case REFUND_STATUS.APPROVED:
        return 2;
      case REFUND_STATUS.COMPLETED:
        return 3;
      default:
        return 0;
    }
  };

  // AI Smart Alerts
  useEffect(() => {
    if (selectedStay && refundStatus === REFUND_STATUS.PENDING) {
      setAiMessage("Your request is under review. Owners typically respond within 24-48 hours.");
      setShowAIAssistant(true);
    } else if (selectedStay && refundStatus === REFUND_STATUS.APPROVED) {
      setAiMessage("Great news! Your refund has been approved. The amount will be transferred within 3-5 business days.");
      setShowAIAssistant(true);
    } else if (selectedStay && refundStatus === REFUND_STATUS.COMPLETED) {
      setAiMessage("Refund completed successfully! Check your bank account for the credited amount.");
      setShowAIAssistant(true);
    } else {
      setShowAIAssistant(false);
    }
  }, [selectedStay, refundStatus]);

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isFormValid = () => {
    return selectedStayId && formData.vacateReason && formData.vacateDate;
  };

  const submitVacateRequest = async () => {
    if (!selectedStayId) {
      alert("Please select a booking");
      return;
    }
    if (!formData.vacateReason || !formData.vacateDate) {
      alert("Please fill all required fields");
      return;
    }

    const selectedDate = new Date(formData.vacateDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      alert("Vacate date cannot be in the past");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post("/bookings/vacate/request", {
        bookingId: selectedStayId,
        vacate_date: formData.vacateDate,
        reason: formData.vacateReason,
        account_number: formData.accountNumber || "",
        ifsc_code: formData.ifscCode || "",
        upi_id: formData.upiId || "",
      });
      if (res.data.success) {
        alert("✅ Vacate request submitted successfully");
        loadBookings();
        setFormData({
          vacateDate: "",
          vacateReason: "",
          accountNumber: "",
          ifscCode: "",
          upiId: "",
        });
        setShowMobileForm(false);
        setActiveTab("status");
        setHasSubmittedRequest(true);
      }
    } catch (err) {
      console.error(err);
      if (err.response?.data?.message === "Vacate already requested") {
        alert("⚠️ Vacate request already submitted for this booking");
      } else {
        alert(err.response?.data?.message || "Vacate request failed");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptRefund = async (bookingId) => {
    try {
      await api.post("/bookings/refunds/accept", { bookingId });
      alert("✅ Refund accepted successfully");
      loadBookings();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to accept refund");
    }
  };

  const handleRejectRefund = async (bookingId) => {
    try {
      await api.post("/bookings/refunds/reject", { bookingId });
      alert("❌ Refund rejected");
      loadBookings();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to reject refund");
    }
  };

  const handleRequestAgain = () => {
    setFormData({
      vacateDate: "",
      vacateReason: "",
      accountNumber: "",
      ifscCode: "",
      upiId: "",
    });
    setShowMobileForm(true);
    setActiveTab("form");
    setHasSubmittedRequest(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Completion screen
  if (selectedStay && refundStatus === REFUND_STATUS.COMPLETED) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="relative w-full max-w-sm p-6 rounded-3xl bg-white shadow-xl text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5 }}
            className="text-6xl mb-4"
          >
            🎉
          </motion.div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Refund Completed!</h2>
          <p className="text-gray-500 text-sm mb-4">
            Your security deposit refund of ₹
            {selectedStay.deposit_amount || selectedStay.refund_amount || 0} has been
            processed successfully.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCancel}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-indigo-200"
          >
            Close Dashboard
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  // Mobile Bottom Sheet Component
  const MobileBottomSheet = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end"
        style={{ background: "rgba(0,0,0,0.5)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 flex justify-between items-center p-4 border-b border-gray-100 bg-white">
            <h3 className="text-gray-800 font-semibold text-lg">{title}</h3>
            <button onClick={onClose} className="p-1 rounded-full bg-gray-100">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="p-4">{children}</div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-md mx-auto px-4 py-4">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Vacate & Refund
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage your vacate requests and track refunds</p>
        </motion.div>

        {/* Booking Selection Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative rounded-xl bg-white border border-gray-100 shadow-sm p-4 mb-4"
        >
          <label className="block text-gray-500 text-xs font-medium mb-2 flex items-center gap-1">
            <Building className="w-3 h-3" /> Select Your Booking
          </label>
          <div className="relative">
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200 cursor-pointer transition-all active:bg-gray-100"
            >
              <span className="text-gray-700 text-sm truncate">
                {selectedStay
                  ? `${selectedStay.pg_name} - Rm ${selectedStay.room_no}`
                  : loadingStays
                  ? "Loading bookings..."
                  : "Choose a property"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </div>
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-white border border-gray-200 shadow-lg z-50 overflow-hidden"
                >
                  <div className="p-3 border-b border-gray-100">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                      <Search className="w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search bookings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent text-gray-700 text-sm placeholder-gray-300 outline-none flex-1"
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filteredStays.map((stay) => (
                      <div
                        key={stay.id}
                        onClick={() => {
                          setSelectedStayId(stay.id.toString());
                          setIsDropdownOpen(false);
                          setSearchQuery("");
                        }}
                        className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="text-gray-800 text-sm font-medium">{stay.pg_name}</div>
                        <div className="text-gray-400 text-xs">
                          Room {stay.room_no} • {stay.room_type} Sharing
                        </div>
                      </div>
                    ))}
                    {filteredStays.length === 0 && (
                      <div className="p-4 text-center text-gray-400 text-sm">No bookings found</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Tabs for Mobile - Only show if request exists */}
        {selectedStay && isJoined && hasSubmittedRequest && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab("status")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "status"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              Status Overview
            </button>
            <button
              onClick={() => {
                setActiveTab("form");
                setShowMobileForm(true);
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "form"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              New Request
            </button>
          </div>
        )}

        {/* Status Tab Content - Only shown if request has been submitted */}
        {hasSubmittedRequest && activeTab === "status" && (
          <div className="space-y-4">
            {selectedStay && (
              <>
                {/* Property Details Card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-white border border-gray-100 shadow-sm p-4"
                >
                  <h3 className="text-gray-700 font-semibold text-sm mb-3 flex items-center gap-2">
                    <Building className="w-4 h-4 text-indigo-500" /> Property Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">PG Name</span>
                      <span className="text-gray-700">{selectedStay.pg_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Room Number</span>
                      <span className="text-gray-700">{selectedStay.room_no}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Room Type</span>
                      <span className="text-gray-700">{selectedStay.room_type} Sharing</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="text-gray-400">Security Deposit</span>
                      <span className="text-emerald-600 font-bold text-lg">
                        ₹{selectedStay.deposit_amount}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Refund Status Card */}
                {refundStatus && (
                  <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-4">
                    <h3 className="text-gray-700 font-semibold text-sm mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-indigo-500" /> Refund Status
                    </h3>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-gray-400 text-xs">Refund Amount</div>
                        <div className="text-2xl font-bold text-gray-800">
                          ₹{selectedStay.deposit_amount || selectedStay.refund_amount || 0}
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          refundStatus === REFUND_STATUS.COMPLETED
                            ? "bg-emerald-100 text-emerald-700"
                            : refundStatus === REFUND_STATUS.APPROVED
                            ? "bg-blue-100 text-blue-700"
                            : refundStatus === REFUND_STATUS.PENDING
                            ? "bg-amber-100 text-amber-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {refundStatus === REFUND_STATUS.COMPLETED
                          ? "Completed"
                          : refundStatus === REFUND_STATUS.APPROVED
                          ? "Approved"
                          : refundStatus === REFUND_STATUS.PENDING
                          ? "Pending"
                          : "Rejected"}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Request</span>
                        <span>Review</span>
                        <span>Approval</span>
                        <span>Disbursal</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(getCurrentStageIndex() / 3) * 100}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full bg-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Accept/Reject Buttons */}
                    {refundStatus === REFUND_STATUS.APPROVED &&
                      selectedStay.deposit_user_approval === "pending" && (
                        <div className="flex gap-3 mt-4">
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleAcceptRefund(selectedStay.id)}
                            className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2"
                          >
                            <ThumbsUp className="w-4 h-4" /> Accept
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleRejectRefund(selectedStay.id)}
                            className="flex-1 py-2.5 rounded-lg bg-rose-600 text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2"
                          >
                            <ThumbsDown className="w-4 h-4" /> Reject
                          </motion.button>
                        </div>
                      )}

                    {refundStatus === REFUND_STATUS.REJECTED && (
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleRequestAgain}
                        className="w-full mt-3 py-2.5 rounded-lg bg-amber-500 text-white font-semibold text-sm flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" /> Request Again
                      </motion.button>
                    )}
                  </div>
                )}

                {/* Timeline */}
                {refundStatus && (
                  <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-4">
                    <h3 className="text-gray-700 font-semibold text-sm mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-500" /> Refund Timeline
                    </h3>
                    <div className="relative">
                      {REFUND_STAGES.map((stage, idx) => {
                        const isCompleted = idx <= getCurrentStageIndex();
                        const isCurrent = idx === getCurrentStageIndex();
                        const StageIcon = stage.icon;
                        return (
                          <div key={stage.id} className="relative flex items-start gap-3 pb-5 last:pb-0">
                            {idx < REFUND_STAGES.length - 1 && (
                              <div
                                className={`absolute left-4 top-7 w-0.5 h-12 ${
                                  isCompleted ? "bg-indigo-300" : "bg-gray-200"
                                }`}
                              />
                            )}
                            <div
                              className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                isCompleted
                                  ? "bg-indigo-600 text-white shadow-sm"
                                  : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              <StageIcon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 pt-0.5">
                              <div className="flex items-center justify-between flex-wrap gap-1">
                                <span
                                  className={`text-sm font-medium ${
                                    isCompleted ? "text-gray-800" : "text-gray-400"
                                  }`}
                                >
                                  {stage.label}
                                </span>
                                {isCurrent && refundStatus === REFUND_STATUS.PENDING && (
                                  <span className="text-xs text-amber-600 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> In Progress
                                  </span>
                                )}
                                {isCurrent && refundStatus === REFUND_STATUS.APPROVED && (
                                  <span className="text-xs text-emerald-600 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Approved
                                  </span>
                                )}
                              </div>
                              {idx === 0 && refundStatus === REFUND_STATUS.PENDING && (
                                <p className="text-gray-400 text-xs mt-0.5">Waiting for owner approval</p>
                              )}
                              {idx === 2 && refundStatus === REFUND_STATUS.APPROVED && (
                                <p className="text-gray-400 text-xs mt-0.5">Amount will be credited soon</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* AI Smart Alert */}
            <AnimatePresence>
              {showAIAssistant && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="relative rounded-xl bg-indigo-50 border border-indigo-100 shadow-sm p-4 overflow-hidden"
                >
                  <div className="flex items-start gap-3 relative z-10">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="text-indigo-800 font-semibold text-xs">AI Assistant</h4>
                      <p className="text-indigo-600 text-xs mt-0.5">{aiMessage}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Vacate Request Form - Show if no request submitted OR if "New Request" tab is active */}
        {(!hasSubmittedRequest || (hasSubmittedRequest && activeTab === "form")) && (
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-white border border-gray-100 shadow-sm p-4"
            >
              <h3 className="text-gray-700 font-semibold text-sm mb-4 flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-500" /> Submit Vacate Request
              </h3>
              
              {!selectedStay && (
                <div className="text-center py-6">
                  <Building className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Please select a booking to continue</p>
                </div>
              )}

              {selectedStay && !isJoined && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <p className="text-amber-700 text-xs">
                      You haven't checked in yet. Vacate requests are only available after joining.
                    </p>
                  </div>
                </div>
              )}

              {selectedStay && isJoined && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-600 text-xs mb-1">Vacate Date *</label>
                    <input
                      type="date"
                      name="vacateDate"
                      min={new Date().toISOString().split("T")[0]}
                      value={formData.vacateDate}
                      onChange={handleChange}
                      className="w-full p-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-sm focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 text-xs mb-1">Reason *</label>
                    <textarea
                      name="vacateReason"
                      rows={3}
                      placeholder="Please provide a reason for vacating..."
                      value={formData.vacateReason}
                      onChange={handleChange}
                      className="w-full p-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-sm placeholder-gray-300 focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 transition-all resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 text-xs mb-1">Account Number (Optional)</label>
                    <input
                      type="text"
                      name="accountNumber"
                      placeholder="Enter account number"
                      value={formData.accountNumber}
                      onChange={handleChange}
                      className="w-full p-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-sm placeholder-gray-300 focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-600 text-xs mb-1">IFSC Code</label>
                      <input
                        type="text"
                        name="ifscCode"
                        placeholder="IFSC"
                        value={formData.ifscCode}
                        onChange={handleChange}
                        className="w-full p-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-sm placeholder-gray-300 focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 text-xs mb-1">UPI ID</label>
                      <input
                        type="text"
                        name="upiId"
                        placeholder="name@bank"
                        value={formData.upiId}
                        onChange={handleChange}
                        className="w-full p-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-sm placeholder-gray-300 focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={onCancel}
                      className="flex-1 py-3 rounded-lg bg-gray-100 border border-gray-200 text-gray-600 font-medium text-sm"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={submitVacateRequest}
                      disabled={!isFormValid() || isSubmitting}
                      className={`flex-1 py-3 rounded-lg font-medium text-sm transition-all ${
                        isFormValid() && !isSubmitting
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {isSubmitting ? "Submitting..." : "Submit Request"}
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Info Note when no booking selected */}
        {!selectedStay && (
          <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-6 text-center">
            <Building className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Select a booking to view refund status or submit a vacate request</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VacateRequestPage;