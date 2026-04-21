import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building,
  Users,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Search,
  Filter,
  RefreshCw,
  Phone,
  Mail,
  AlertCircle,
  TrendingUp,
  Home,
  UserCheck,
  Calendar,
  Star,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Video,
  Info,
  Shield,
  Award
} from "lucide-react";

const API_BASE = "https://nepxall-backend.onrender.com/api";
const FILES_BASE = "https://nepxall-backend.onrender.com";

const AdminAllPGs = () => {
  const navigate = useNavigate();
  const [pgs, setPgs] = useState([]);
  const [filteredPGs, setFilteredPGs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expandedPG, setExpandedPG] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalRevenue: 0
  });
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const token = localStorage.getItem("token");

  const showNotification = (message, type = "success") => {
    setSuccessMessage(message);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const fetchPGs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/admin/pgs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      const text = await res.text();
      const data = JSON.parse(text);

      if (data.success) {
        setPgs(data.data);
        calculateStats(data.data);
      } else {
        setError("Failed to load PGs");
      }
    } catch (err) {
      console.error("Error fetching PGs:", err);
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  const calculateStats = (data) => {
    const pending = data.filter(p => p.status === "pending").length;
    const approved = data.filter(p => p.status === "approved").length;
    const rejected = data.filter(p => p.status === "rejected").length;
    const totalRevenue = data.reduce((sum, p) => sum + (p.single_sharing || 0), 0);

    setStats({
      total: data.length,
      pending,
      approved,
      rejected,
      totalRevenue
    });
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchPGs();
  }, [token, navigate, fetchPGs]);

  useEffect(() => {
    let filtered = [...pgs];

    if (searchTerm) {
      filtered = filtered.filter(pg =>
        pg.pg_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pg.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pg.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pg.area?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(pg => pg.status === statusFilter);
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(pg => pg.pg_category === categoryFilter);
    }

    setFilteredPGs(filtered);
  }, [pgs, searchTerm, statusFilter, categoryFilter]);

  const handleApprove = async (id) => {
    if (!window.confirm("Are you sure you want to approve this property?")) return;

    try {
      setActionLoading(id);
      const res = await fetch(`${API_BASE}/admin/pg/${id}/approve`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        showNotification("Property approved successfully!");
        fetchPGs();
      } else {
        showNotification("Failed to approve property", "error");
      }
    } catch (err) {
      console.error("Approve error:", err);
      showNotification("Error approving property", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) {
      showNotification("Please provide a rejection reason", "error");
      return;
    }

    try {
      setActionLoading(id);
      const res = await fetch(`${API_BASE}/admin/pg/${id}/reject`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (res.ok) {
        showNotification("Property rejected successfully!");
        setShowRejectModal(null);
        setRejectReason("");
        fetchPGs();
      } else {
        showNotification("Failed to reject property", "error");
      }
    } catch (err) {
      console.error("Reject error:", err);
      showNotification("Error rejecting property", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      approved: { icon: CheckCircle, color: "text-green-700", bg: "bg-green-50", label: "Approved" },
      pending: { icon: Clock, color: "text-yellow-700", bg: "bg-yellow-50", label: "Pending" },
      rejected: { icon: XCircle, color: "text-red-700", bg: "bg-red-50", label: "Rejected" }
    };
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    return (
      <div className={`${config.bg} ${config.color} px-3 py-1 rounded-full flex items-center gap-1 text-xs font-semibold`}>
        <Icon size={12} />
        <span>{config.label}</span>
      </div>
    );
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && <p className="text-xs text-green-600 mt-2">{trend}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );

  const PGDetailRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
      <Icon size={16} className="text-gray-400 mt-0.5" />
      <div className="flex-1">
        <span className="text-xs text-gray-500 block">{label}</span>
        <span className="text-sm text-gray-800 font-medium">{value || "—"}</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 text-center max-w-md">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={fetchPGs} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Toast Notification */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-gray-900 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
            <CheckCircle size={18} className="text-green-400" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowRejectModal(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <XCircle size={24} className="text-red-600" />
              <h3 className="text-xl font-semibold text-gray-900">Reject Property</h3>
            </div>
            <p className="text-gray-600 mb-4">Please provide a reason for rejection (the owner will see this):</p>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-transparent h-32"
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRejectModal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={actionLoading === showRejectModal}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {actionLoading === showRejectModal ? "Processing..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Property Management</h1>
          <p className="text-gray-600">Manage all PG properties, approvals, and owner information</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Properties" value={stats.total} icon={Building} color="bg-blue-100 text-blue-600" />
          <StatCard title="Pending Review" value={stats.pending} icon={Clock} color="bg-yellow-100 text-yellow-600" />
          <StatCard title="Approved" value={stats.approved} icon={CheckCircle} color="bg-green-100 text-green-600" />
          <StatCard title="Rejected" value={stats.rejected} icon={XCircle} color="bg-red-100 text-red-600" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, owner, city, or area..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="boys">Boys Only</option>
                <option value="girls">Girls Only</option>
                <option value="co-living">Co-Living</option>
              </select>
              <button
                onClick={fetchPGs}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {filteredPGs.length} of {pgs.length} properties
          </p>
        </div>

        {/* PG Cards Grid */}
        {filteredPGs.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <Building size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No properties found</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPGs.map((pg) => (
              <div
                key={pg.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{pg.pg_name || "Unnamed Property"}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin size={14} />
                        <span>{pg.area}, {pg.city}</span>
                      </div>
                    </div>
                    {getStatusBadge(pg.status)}
                  </div>
                  
                  {/* Quick Info */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <DollarSign size={14} />
                      <span className="font-semibold">{pg.single_sharing ? `₹${pg.single_sharing.toLocaleString()}` : "—"}</span>
                      <span className="text-xs">/month</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Users size={14} />
                      <span>{pg.pg_category || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* Owner Info */}
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck size={14} className="text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">{pg.owner_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <a href={`tel:${pg.owner_phone}`} className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                        <Phone size={12} />
                        Call
                      </a>
                      <a href={`mailto:${pg.owner_email}`} className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                        <Mail size={12} />
                        Email
                      </a>
                    </div>
                  </div>
                </div>

                {/* Expandable Details */}
                <button
                  onClick={() => setExpandedPG(expandedPG === pg.id ? null : pg.id)}
                  className="w-full px-5 py-3 text-left text-sm text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-between"
                >
                  <span className="font-medium">{expandedPG === pg.id ? "Hide Details" : "View Details"}</span>
                  {expandedPG === pg.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {expandedPG === pg.id && (
                  <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-gray-50/50">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2 text-sm">Property Details</h4>
                        <PGDetailRow label="PG Code" value={pg.pg_code} icon={Building} />
                        <PGDetailRow label="Address" value={pg.address} icon={MapPin} />
                        <PGDetailRow label="Landmark" value={pg.landmark} icon={MapPin} />
                        <PGDetailRow label="Pincode" value={pg.pincode} icon={MapPin} />
                        <PGDetailRow label="Type" value={pg.pg_type} icon={Home} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2 text-sm">Pricing</h4>
                        <PGDetailRow label="Single Sharing" value={pg.single_sharing ? `₹${pg.single_sharing.toLocaleString()}` : "—"} icon={DollarSign} />
                        <PGDetailRow label="Double Sharing" value={pg.double_sharing ? `₹${pg.double_sharing.toLocaleString()}` : "—"} icon={DollarSign} />
                        <PGDetailRow label="Triple Sharing" value={pg.triple_sharing ? `₹${pg.triple_sharing.toLocaleString()}` : "—"} icon={DollarSign} />
                        <PGDetailRow label="Deposit" value={pg.deposit_amount ? `₹${pg.deposit_amount.toLocaleString()}` : "—"} icon={DollarSign} />
                        <PGDetailRow label="Maintenance" value={pg.maintenance_amount ? `₹${pg.maintenance_amount.toLocaleString()}` : "—"} icon={DollarSign} />
                      </div>
                    </div>

                    {/* Photos Preview */}
                    {pg.photos && pg.photos.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-gray-800 mb-2 text-sm flex items-center gap-2">
                          <ImageIcon size={14} />
                          Photos ({pg.photos.length})
                        </h4>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {pg.photos.slice(0, 3).map((photo, idx) => (
                            <img
                              key={idx}
                              src={`${FILES_BASE}${photo}`}
                              alt={`Property ${idx + 1}`}
                              className="h-20 w-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => window.open(`${FILES_BASE}${photo}`, '_blank')}
                            />
                          ))}
                          {pg.photos.length > 3 && (
                            <div className="h-20 w-20 bg-gray-200 rounded-lg flex items-center justify-center text-sm text-gray-500">
                              +{pg.photos.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* System Info */}
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Created: {pg.created_at ? new Date(pg.created_at).toLocaleDateString() : "—"}</span>
                        <span>Updated: {pg.updated_at ? new Date(pg.updated_at).toLocaleDateString() : "—"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {pg.status === "pending" && (
                  <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                    <button
                      onClick={() => handleApprove(pg.id)}
                      disabled={actionLoading === pg.id}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {actionLoading === pg.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <ThumbsUp size={16} />
                          Approve
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowRejectModal(pg.id)}
                      disabled={actionLoading === pg.id}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <ThumbsDown size={16} />
                      Reject
                    </button>
                    <button
                      onClick={() => navigate(`/admin/pg/${pg.id}`)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all flex items-center gap-2"
                    >
                      <Eye size={16} />
                      View
                    </button>
                  </div>
                )}

                {pg.status !== "pending" && (
                  <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
                    <button
                      onClick={() => navigate(`/admin/pg/${pg.id}`)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />
                      View Full Details
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AdminAllPGs;