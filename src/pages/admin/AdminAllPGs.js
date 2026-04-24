// AdminAllPGs.js
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
  RefreshCw,
  Phone,
  Mail,
  AlertCircle,
  Home,
  UserCheck,
  Calendar,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Info,
  TrendingUp,
  Filter,
  Edit,
  Trash2,
  Plus,
  Grid,
  List,
  Download,
  Star,
  Camera,
  Video,
  Lock,
  Shield,
  Loader2
} from "lucide-react";

const API_BASE = "https://nepxall-backend.onrender.com/api";
const FILES_BASE = "https://nepxall-backend.onrender.com";

const getCorrectImageUrl = (photo) => {
  if (!photo) return "https://via.placeholder.com/600x400?text=No+Image";

  if (photo.startsWith('http')) {
    return photo;
  }

  if (photo.includes('/uploads/')) {
    const uploadsIndex = photo.indexOf('/uploads/');
    if (uploadsIndex !== -1) {
      const relativePath = photo.substring(uploadsIndex);
      return `${FILES_BASE}${relativePath}`;
    }
  }

  const normalizedPath = photo.startsWith('/') ? photo : `/${photo}`;
  return `${FILES_BASE}${normalizedPath}`;
};

const AdminAllPGs = () => {
  const navigate = useNavigate();
  const [pgs, setPgs] = useState([]);
  const [filteredPGs, setFilteredPGs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [expandedPG, setExpandedPG] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalRevenue: 0,
    boys: 0,
    girls: 0,
    coLiving: 0
  });

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

      console.log("Fetching PGs from:", `${API_BASE}/admin/pgs`);
      
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

      const data = await res.json();
      console.log("API Response:", data);

      if (data.success && Array.isArray(data.data)) {
        if (data.data.length > 0) {
          console.log("First PG item structure:", data.data[0]);
        }
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
    const approved = data.filter(p => p.status === "approved" || p.status === "active").length;
    const rejected = data.filter(p => p.status === "rejected").length;
    const totalRevenue = data.reduce((sum, p) => sum + (Number(p.single_sharing) || 0), 0);
    const boys = data.filter(p => p.pg_category === "boys").length;
    const girls = data.filter(p => p.pg_category === "girls").length;
    const coLiving = data.filter(p => p.pg_category === "co-living" || p.pg_category === "coliving").length;

    setStats({
      total: data.length,
      pending,
      approved,
      rejected,
      totalRevenue,
      boys,
      girls,
      coLiving
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
        pg.area?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pg.pg_code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(pg => pg.status === statusFilter);
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(pg => pg.pg_category === categoryFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(pg => pg.pg_type === typeFilter);
    }

    setFilteredPGs(filtered);
  }, [pgs, searchTerm, statusFilter, categoryFilter, typeFilter]);

  const handleApprove = async (id) => {
    if (!id) {
      console.error("Cannot approve: ID is missing");
      showNotification("Invalid property ID", "error");
      return;
    }
    
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
        const error = await res.json();
        showNotification(error.message || "Failed to approve property", "error");
      }
    } catch (err) {
      console.error("Approve error:", err);
      showNotification("Error approving property", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    if (!id) {
      console.error("Cannot reject: ID is missing");
      showNotification("Invalid property ID", "error");
      return;
    }
    
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
        const error = await res.json();
        showNotification(error.message || "Failed to reject property", "error");
      }
    } catch (err) {
      console.error("Reject error:", err);
      showNotification("Error rejecting property", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = (pgId, pgName) => {
    if (!pgId) {
      console.error("Cannot view details: PG ID is missing", { pgId, pgName });
      showNotification("Invalid property ID. Cannot view details.", "error");
      return;
    }
    
    console.log(`Navigating to: /admin/pg/${pgId}`);
    navigate(`/admin/pg/${pgId}`);
  };

  const getStatusBadge = (status) => {
    const configs = {
      approved: { icon: CheckCircle, color: "text-green-700", bg: "bg-green-50", label: "Approved" },
      active: { icon: CheckCircle, color: "text-green-700", bg: "bg-green-50", label: "Active" },
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

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'boys': return <Users className="text-blue-500" size={14} />;
      case 'girls': return <Users className="text-pink-500" size={14} />;
      case 'co-living': return <Users className="text-purple-500" size={14} />;
      default: return <Building size={14} />;
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, onClick }) => (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
    >
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

  const AmenityBadge = ({ label, value }) => {
    const isAvailable = value === true || value === 1 || value === "1";
    return (
      <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${isAvailable ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'}`}>
        {isAvailable ? <CheckCircle size={10} /> : <XCircle size={10} />}
        <span>{label}</span>
      </div>
    );
  };

  const exportToCSV = () => {
    const headers = ["ID", "PG Name", "Owner", "City", "Status", "Category", "Price", "Phone", "Email"];
    const data = filteredPGs.map(pg => [
      pg.id,
      pg.pg_name,
      pg.owner_name,
      pg.city,
      pg.status,
      pg.pg_category,
      pg.single_sharing,
      pg.owner_phone,
      pg.owner_email
    ]);
    
    const csvContent = [headers, ...data].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pgs_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification("Export completed successfully!");
  };

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
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-gray-900 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
            <CheckCircle size={18} className="text-green-400" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

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
                {actionLoading === showRejectModal ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Property Management Dashboard</h1>
          <p className="text-gray-600">Manage all PG properties, approvals, and owner information</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <StatCard 
            title="Total Properties" 
            value={stats.total} 
            icon={Building} 
            color="bg-blue-100 text-blue-600"
            onClick={() => { setStatusFilter("all"); setSearchTerm(""); }}
          />
          <StatCard 
            title="Pending Review" 
            value={stats.pending} 
            icon={Clock} 
            color="bg-yellow-100 text-yellow-600"
            onClick={() => setStatusFilter("pending")}
          />
          <StatCard 
            title="Approved" 
            value={stats.approved} 
            icon={CheckCircle} 
            color="bg-green-100 text-green-600"
            onClick={() => setStatusFilter("approved")}
          />
          <StatCard 
            title="Rejected" 
            value={stats.rejected} 
            icon={XCircle} 
            color="bg-red-100 text-red-600"
            onClick={() => setStatusFilter("rejected")}
          />
          <StatCard 
            title="Boys PG" 
            value={stats.boys} 
            icon={Users} 
            color="bg-blue-100 text-blue-600"
            onClick={() => setCategoryFilter("boys")}
          />
          <StatCard 
            title="Girls PG" 
            value={stats.girls} 
            icon={Users} 
            color="bg-pink-100 text-pink-600"
            onClick={() => setCategoryFilter("girls")}
          />
          <StatCard 
            title="Co-Living" 
            value={stats.coLiving} 
            icon={Users} 
            color="bg-purple-100 text-purple-600"
            onClick={() => setCategoryFilter("co-living")}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, owner, city, area, or PG code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3 flex-wrap">
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
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="normal">Normal</option>
                <option value="luxury">Luxury</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}`}
                >
                  <List size={18} />
                </button>
              </div>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
              >
                <Download size={16} />
                Export CSV
              </button>
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

        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {filteredPGs.length} of {pgs.length} properties
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Total Revenue: <strong className="text-green-600">₹{stats.totalRevenue.toLocaleString()}</strong></span>
          </div>
        </div>

        {filteredPGs.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <Building size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No properties found</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPGs.map((pg) => {
              if (!pg.id) {
                console.warn("PG missing ID:", pg);
                return null;
              }
              
              const firstPhoto = pg.photos && pg.photos.length > 0 ? pg.photos[0] : null;
              
              return (
                <div
                  key={pg.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300"
                >
                  <div className="relative h-48 bg-gray-100">
                    {firstPhoto ? (
                      <img
                        src={getCorrectImageUrl(firstPhoto)}
                        alt={pg.pg_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/600x400?text=No+Image";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building size={48} className="text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(pg.status)}
                    </div>
                    <div className="absolute bottom-3 left-3 flex gap-1">
                      {pg.photos && pg.photos.length > 0 && (
                        <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <Camera size={10} />
                          {pg.photos.length}
                        </span>
                      )}
                      {pg.videos && pg.videos.length > 0 && (
                        <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <Video size={10} />
                          {pg.videos.length}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{pg.pg_name || "Unnamed Property"}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <MapPin size={14} />
                          <span>{pg.area}, {pg.city}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm mt-3">
                      <div className="flex items-center gap-1 text-gray-600">
                        <DollarSign size={14} />
                        <span className="font-semibold">{pg.single_sharing ? `₹${Number(pg.single_sharing).toLocaleString()}` : "—"}</span>
                        <span className="text-xs">/month</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        {getCategoryIcon(pg.pg_category)}
                        <span className="capitalize">{pg.pg_category || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Star size={14} className="text-yellow-500" />
                        <span className="capitalize">{pg.pg_type || "normal"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <UserCheck size={14} className="text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">{pg.owner_name || pg.contact_person}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {(pg.owner_phone || pg.contact_phone) && (
                          <a href={`tel:${pg.owner_phone || pg.contact_phone}`} className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                            <Phone size={12} />
                            Call
                          </a>
                        )}
                        {(pg.owner_email || pg.contact_email) && (
                          <a href={`mailto:${pg.owner_email || pg.contact_email}`} className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                            <Mail size={12} />
                            Email
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedPG(expandedPG === pg.id ? null : pg.id)}
                    className="w-full px-5 py-3 text-left text-sm text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-between"
                  >
                    <span className="font-medium">{expandedPG === pg.id ? "Hide Details" : "View Complete Details"}</span>
                    {expandedPG === pg.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {expandedPG === pg.id && (
                    <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-gray-50/50 max-h-96 overflow-y-auto">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2 text-sm">Property Details</h4>
                          <PGDetailRow label="PG Code" value={pg.pg_code} icon={Building} />
                          <PGDetailRow label="Address" value={pg.address} icon={MapPin} />
                          <PGDetailRow label="Landmark" value={pg.landmark} icon={MapPin} />
                          <PGDetailRow label="Pincode" value={pg.pincode} icon={MapPin} />
                          <PGDetailRow label="Type" value={pg.pg_type} icon={Home} />
                          <PGDetailRow label="Total Rooms" value={pg.total_rooms} icon={Building} />
                          <PGDetailRow label="Available Rooms" value={pg.available_rooms} icon={Building} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2 text-sm">Pricing</h4>
                          <PGDetailRow label="Single Sharing" value={pg.single_sharing ? `₹${Number(pg.single_sharing).toLocaleString()}` : "—"} icon={DollarSign} />
                          <PGDetailRow label="Double Sharing" value={pg.double_sharing ? `₹${Number(pg.double_sharing).toLocaleString()}` : "—"} icon={DollarSign} />
                          <PGDetailRow label="Triple Sharing" value={pg.triple_sharing ? `₹${Number(pg.triple_sharing).toLocaleString()}` : "—"} icon={DollarSign} />
                          <PGDetailRow label="Deposit" value={pg.deposit_amount ? `₹${Number(pg.deposit_amount).toLocaleString()}` : "—"} icon={DollarSign} />
                          <PGDetailRow label="Maintenance" value={pg.maintenance_amount ? `₹${Number(pg.maintenance_amount).toLocaleString()}` : "—"} icon={DollarSign} />
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className="font-semibold text-gray-800 mb-2 text-sm">Key Amenities</h4>
                        <div className="flex flex-wrap gap-1">
                          {pg.wifi_available && <AmenityBadge label="WiFi" value={true} />}
                          {pg.ac_available && <AmenityBadge label="AC" value={true} />}
                          {pg.food_available && <AmenityBadge label="Food" value={true} />}
                          {pg.parking_available && <AmenityBadge label="Parking" value={true} />}
                          {pg.gym && <AmenityBadge label="Gym" value={true} />}
                          {pg.cctv && <AmenityBadge label="CCTV" value={true} />}
                        </div>
                      </div>

                      {pg.description && (
                        <div className="mt-4">
                          <h4 className="font-semibold text-gray-800 mb-2 text-sm">Description</h4>
                          <p className="text-sm text-gray-600 line-clamp-3">{pg.description}</p>
                        </div>
                      )}

                      {pg.photos && pg.photos.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-semibold text-gray-800 mb-2 text-sm flex items-center gap-2">
                            <ImageIcon size={14} />
                            Photos ({pg.photos.length})
                          </h4>
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {pg.photos.slice(0, 4).map((photo, idx) => (
                              <img
                                key={idx}
                                src={getCorrectImageUrl(photo)}
                                alt={`Property ${idx + 1}`}
                                className="h-16 w-16 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => window.open(getCorrectImageUrl(photo), '_blank')}
                              />
                            ))}
                            {pg.photos.length > 4 && (
                              <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-500">
                                +{pg.photos.length - 4}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                          <span>Created: {pg.created_at ? new Date(pg.created_at).toLocaleString() : "—"}</span>
                          <span>Updated: {pg.updated_at ? new Date(pg.updated_at).toLocaleString() : "—"}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                    {pg.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(pg.id)}
                          disabled={actionLoading === pg.id}
                          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {actionLoading === pg.id ? (
                            <Loader2 size={16} className="animate-spin" />
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
                      </>
                    )}
                    <button
                      onClick={() => {
                        if (pg.id) {
                          handleViewDetails(pg.id, pg.pg_name);
                        } else {
                          console.error("Cannot navigate: PG ID is missing", pg);
                          showNotification("Cannot view details: Invalid property ID", "error");
                        }
                      }}
                      className={`${pg.status === "pending" ? "flex-1" : "w-full"} bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2`}
                    >
                      <Eye size={16} />
                      {pg.status === "pending" ? "View & Edit" : "View Full Details"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPGs.map((pg) => {
                    if (!pg.id) return null;
                    
                    return (
                      <tr key={pg.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{pg.id}</td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{pg.pg_name}</div>
                            <div className="text-xs text-gray-500">Code: {pg.pg_code}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm text-gray-900">{pg.owner_name || pg.contact_person}</div>
                            <div className="text-xs text-gray-500">{pg.owner_phone || pg.contact_phone}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{pg.city}</div>
                          <div className="text-xs text-gray-500">{pg.area}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {pg.single_sharing ? `₹${Number(pg.single_sharing).toLocaleString()}` : "—"}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(pg.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {pg.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleApprove(pg.id)}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded transition-all"
                                  title="Approve"
                                >
                                  <ThumbsUp size={16} />
                                </button>
                                <button
                                  onClick={() => setShowRejectModal(pg.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-all"
                                  title="Reject"
                                >
                                  <ThumbsDown size={16} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => {
                                if (pg.id) {
                                  handleViewDetails(pg.id, pg.pg_name);
                                }
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-all"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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