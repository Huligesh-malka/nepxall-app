import React, { useEffect, useState, useCallback } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Building,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Phone,
  Mail,
  AlertCircle,
  Home,
  UserCheck,
  Calendar,
  Edit2,
  Save,
  X,
  Image as ImageIcon,
  Video,
  Info,
  Shield,
  Users,
  Wifi,
  Coffee,
  Car,
  Tv,
  Wind,
  Lock,
  Volume2,
  PawPrint,
  Music,
  Utensils,
  Dumbbell,
  Droplet,
  Camera,
  ChevronLeft,
  ExternalLink,
  Layers,
  Bed,
  Bath,
  Maximize2,
  Plus,
  Trash2,
  RefreshCw
} from "lucide-react";

const API_BASE = "https://nepxall-backend.onrender.com/api";
const FILES_BASE = "https://nepxall-backend.onrender.com";

const AdminPGDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();

  const [pg, setPG] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const token = localStorage.getItem("token");

  const showNotification = (message, type = "success") => {
    setSuccessMessage(message);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const loadPG = useCallback(async () => {
    // Check if id exists
    if (!id) {
      console.error("No ID provided in URL params");
      showNotification("Invalid property ID", "error");
      navigate("/admin/pgs");
      return;
    }

    try {
      setLoading(true);
      console.log(`Fetching PG with ID: ${id}`);
      
      const res = await fetch(`${API_BASE}/admin/pg/${id}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (res.status === 404) {
        showNotification("Property not found", "error");
        navigate("/admin/pgs");
        return;
      }
      
      if (res.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      
      const data = await res.json();
      console.log("API Response:", data);
      
      if (data.success && data.data) {
        setPG(data.data);
      } else {
        showNotification(data.message || "Failed to load PG details", "error");
        navigate("/admin/pgs");
      }
    } catch (err) {
      console.error("Load PG error:", err);
      showNotification("Failed to load PG details", "error");
      navigate("/admin/pgs");
    } finally {
      setLoading(false);
    }
  }, [id, token, navigate]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/login");
        return;
      }
      if (role !== "admin") {
        navigate("/");
        return;
      }
      if (id) {
        loadPG();
      } else {
        console.error("No ID parameter found");
        navigate("/admin/pgs");
      }
    }
  }, [loadPG, authLoading, user, role, id, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role !== "admin") return <Navigate to="/" replace />;
  if (!pg) return <Navigate to="/admin/pgs" replace />;
const handleFieldUpdate = async (field, value) => {
  try {
    setSaving(true);

    const res = await fetch(`${API_BASE}/admin/pg/${id}/update-field`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ field, value })
    });

    // ✅ res is used inside same scope
    if (res.ok) {
      setPG(prev => ({ ...prev, [field]: value }));
      showNotification(`${field.replace(/_/g, " ")} updated successfully`);
    } else {
      const error = await res.json();
      showNotification(error.message || "Update failed", "error");
    }

  } catch (err) {
    console.error("Update error:", err);
    showNotification("Update failed", "error");
  } finally {
    setSaving(false);
    setEditingField(null);
    setEditValue("");
  }
};

  const handleApprove = async () => {
    if (!window.confirm("Are you sure you want to approve this property?")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/pg/${id}/approve`, {
        method: "PATCH",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (res.ok) {
        showNotification("Property approved successfully!");
        loadPG();
      } else {
        const error = await res.json();
        showNotification(error.message || "Approval failed", "error");
      }
    } catch (err) {
      console.error("Approval error:", err);
      showNotification("Approval failed", "error");
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      showNotification("Please enter a rejection reason", "error");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/pg/${id}/reject`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ reason: rejectReason })
      });
      if (res.ok) {
        showNotification("Property rejected successfully!");
        setShowReject(false);
        setRejectReason("");
        loadPG();
      } else {
        const error = await res.json();
        showNotification(error.message || "Rejection failed", "error");
      }
    } catch (err) {
      console.error("Rejection error:", err);
      showNotification("Rejection failed", "error");
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if ((pg.photos?.length || 0) + files.length > 10) {
      showNotification("Maximum 10 photos allowed", "error");
      return;
    }

    const formData = new FormData();
    files.forEach(file => formData.append("photos", file));

    setUploading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/pg/${id}/upload-photos`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setPG(prev => ({ ...prev, photos: data.photos }));
        showNotification("Photos uploaded successfully");
        loadPG();
      } else {
        showNotification(data.message || "Upload failed", "error");
      }
    } catch (err) {
      console.error("Upload error:", err);
      showNotification("Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoUrl) => {
    if (!window.confirm("Remove this photo?")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/pg/${id}/delete-photo`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ photo: photoUrl })
      });
      if (res.ok) {
        setPG(prev => ({
          ...prev,
          photos: prev.photos.filter(p => p !== photoUrl)
        }));
        showNotification("Photo removed successfully");
      } else {
        showNotification("Failed to remove photo", "error");
      }
    } catch (err) {
      console.error("Delete error:", err);
      showNotification("Failed to remove photo", "error");
    }
  };

  const getStatusBadge = () => {
    const configs = {
      approved: { icon: CheckCircle, color: "text-green-700", bg: "bg-green-50", label: "Approved" },
      active: { icon: CheckCircle, color: "text-green-700", bg: "bg-green-50", label: "Active" },
      pending: { icon: Clock, color: "text-yellow-700", bg: "bg-yellow-50", label: "Pending" },
      rejected: { icon: XCircle, color: "text-red-700", bg: "bg-red-50", label: "Rejected" }
    };
    const config = configs[pg.status] || configs.pending;
    const Icon = config.icon;
    return (
      <div className={`${config.bg} ${config.color} px-4 py-2 rounded-full flex items-center gap-2 font-semibold text-sm`}>
        <Icon size={16} />
        <span>{config.label}</span>
      </div>
    );
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return "—";
    return `₹${Number(value).toLocaleString("en-IN")}`;
  };

  const EditableField = ({ label, field, value, type = "text", icon: Icon, options = null }) => {
    const isEditing = editingField === field;
    let displayValue = value !== undefined && value !== null ? value : "—";
    const isPriceField = field.includes("sharing") || field.includes("amount") || field.includes("deposit") || field.includes("maintenance");
    
    if (!isEditing && isPriceField && value && value !== "—") {
      displayValue = formatCurrency(value);
    }

    if (isEditing) {
      return (
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              {Icon && <Icon size={16} className="text-blue-600" />}
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </div>
            <div className="flex items-center gap-2 flex-1 justify-end">
              {options ? (
                <select
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : type === "textarea" ? (
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-64 focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  autoFocus
                />
              ) : (
                <input
                  type={type === "number" ? "text" : type}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-40 focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              )}
              <button
                onClick={() => handleFieldUpdate(field, editValue)}
                disabled={saving}
                className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-all text-sm font-medium disabled:opacity-50"
              >
                <Save size={14} className="inline mr-1" />
                Save
              </button>
              <button
                onClick={() => { setEditingField(null); setEditValue(""); }}
                className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-300 transition-all text-sm"
              >
                <X size={14} className="inline mr-1" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="group flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-all">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-gray-400" />}
          <span className="text-sm text-gray-600">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-900 font-medium">
            {type === "textarea" ? (
              <span className="line-clamp-2 max-w-md">{displayValue}</span>
            ) : (
              displayValue
            )}
          </span>
          <button
            onClick={() => {
              setEditingField(field);
              setEditValue(value !== undefined && value !== null ? String(value) : "");
            }}
            className="opacity-0 group-hover:opacity-100 transition-all text-blue-600 hover:text-blue-700"
          >
            <Edit2 size={14} />
          </button>
        </div>
      </div>
    );
  };

  const InfoCard = ({ label, value, icon: Icon }) => (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Icon size={18} className="text-blue-600" />
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-gray-900 font-semibold mt-1">{value || "—"}</p>
        </div>
      </div>
    </div>
  );

  const Section = ({ title, icon: Icon, children }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={20} className="text-blue-600" />}
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
      </div>
      <div className="p-6">
        <div className="grid md:grid-cols-2 gap-2">{children}</div>
      </div>
    </div>
  );

  const AmenityBadge = ({ label, value }) => {
    const isAvailable = value === true || value === 1 || value === "1";
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-400'}`}>
        {isAvailable ? <CheckCircle size={14} /> : <XCircle size={14} />}
        <span>{label}</span>
      </div>
    );
  };

  const TabButton = ({ tab, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
        activeTab === tab
          ? "bg-blue-600 text-white shadow-md"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  // Helper to check if value is a boolean or number for amenities
  const isTrueValue = (val) => val === true || val === 1 || val === "1";

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

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="relative max-w-4xl w-full">
            <img src={`${FILES_BASE}${selectedPhoto}`} alt="Full size" className="w-full h-auto rounded-xl" />
            <button onClick={() => setSelectedPhoto(null)} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-all">
              <X size={24} />
            </button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showReject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowReject(false)}>
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
              <button onClick={() => setShowReject(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button onClick={handleReject} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all">
                Submit Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/admin/pgs")}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft size={20} />
            <span>Back to Properties</span>
          </button>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{pg.pg_name || "Unnamed Property"}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-sm text-gray-500">ID: #{pg.id}</span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500">Code: {pg.pg_code || "—"}</span>
                </div>
              </div>
              {getStatusBadge()}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <InfoCard label="Owner" value={pg.owner_name || pg.contact_person} icon={UserCheck} />
          <InfoCard label="Phone" value={pg.owner_phone || pg.contact_phone} icon={Phone} />
          <InfoCard label="Email" value={pg.owner_email || pg.contact_email} icon={Mail} />
          <InfoCard label="Location" value={`${pg.city || ""}, ${pg.area || ""}`} icon={MapPin} />
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          <TabButton tab="basic" label="Basic Info" icon={Info} />
          <TabButton tab="pricing" label="Pricing" icon={DollarSign} />
          <TabButton tab="amenities" label="Amenities" icon={Shield} />
          <TabButton tab="rules" label="Rules" icon={Lock} />
          <TabButton tab="media" label="Media" icon={Camera} />
          <TabButton tab="system" label="System" icon={Calendar} />
        </div>

        <div className="space-y-6">
          {/* Basic Information Tab */}
          {activeTab === "basic" && (
            <>
              <Section title="Basic Information" icon={Info}>
                <EditableField label="PG Name" field="pg_name" value={pg.pg_name} icon={Building} />
                <EditableField label="PG Code" field="pg_code" value={pg.pg_code} icon={Layers} />
                <EditableField 
                  label="Category" 
                  field="pg_category" 
                  value={pg.pg_category}
                  icon={Users}
                  options={[
                    { value: "boys", label: "Boys" },
                    { value: "girls", label: "Girls" },
                    { value: "co-living", label: "Co-Living" }
                  ]}
                />
                <EditableField 
                  label="Type" 
                  field="pg_type" 
                  value={pg.pg_type}
                  icon={Home}
                  options={[
                    { value: "normal", label: "Normal" },
                    { value: "luxury", label: "Luxury" }
                  ]}
                />
                <EditableField label="City" field="city" value={pg.city} icon={MapPin} />
                <EditableField label="Area / Locality" field="area" value={pg.area} icon={MapPin} />
                <EditableField label="Complete Address" field="address" value={pg.address} icon={MapPin} />
                <EditableField label="Landmark" field="landmark" value={pg.landmark} icon={MapPin} />
                <EditableField label="Pincode" field="pincode" value={pg.pincode} icon={MapPin} />
              </Section>

              <Section title="Location Coordinates" icon={MapPin}>
                <div className="col-span-full">
                  <div className="grid md:grid-cols-2 gap-4">
                    <InfoCard label="Latitude" value={pg.latitude || "—"} icon={MapPin} />
                    <InfoCard label="Longitude" value={pg.longitude || "—"} icon={MapPin} />
                  </div>
                  {pg.latitude && pg.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${pg.latitude},${pg.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <ExternalLink size={16} />
                      View on Google Maps
                    </a>
                  )}
                </div>
              </Section>

              <Section title="Room Details" icon={Bed}>
                <EditableField label="Total Rooms" field="total_rooms" value={pg.total_rooms} type="number" icon={Home} />
                <EditableField label="Total Beds" field="total_beds" value={pg.total_beds} type="number" icon={Bed} />
                <EditableField label="Available Rooms" field="available_rooms" value={pg.available_rooms} type="number" icon={Home} />
                <EditableField label="Room Size (sq ft)" field="room_size" value={pg.room_size} type="number" icon={Maximize2} />
                <EditableField label="Bathroom Type" field="bathroom_type" value={pg.bathroom_type} icon={Bath} />
                <EditableField label="Balcony" field="balcony" value={pg.balcony} icon={Home} />
              </Section>

              <Section title="Description" icon={Info}>
                <div className="col-span-full">
                  <EditableField label="Description" field="description" value={pg.description} type="textarea" />
                </div>
              </Section>

              <Section title="Contact Information" icon={Phone}>
                <EditableField label="Contact Person" field="contact_person" value={pg.contact_person || pg.owner_name} icon={UserCheck} />
                <EditableField label="Contact Phone" field="contact_phone" value={pg.contact_phone || pg.owner_phone} icon={Phone} />
                <EditableField label="Contact Email" field="contact_email" value={pg.contact_email || pg.owner_email} icon={Mail} />
              </Section>
            </>
          )}

          {/* Pricing Tab */}
          {activeTab === "pricing" && (
            <Section title="Pricing Details" icon={DollarSign}>
              <EditableField label="Single Sharing" field="single_sharing" value={pg.single_sharing} type="number" icon={DollarSign} />
              <EditableField label="Double Sharing" field="double_sharing" value={pg.double_sharing} type="number" icon={DollarSign} />
              <EditableField label="Triple Sharing" field="triple_sharing" value={pg.triple_sharing} type="number" icon={DollarSign} />
              <EditableField label="Four Sharing" field="four_sharing" value={pg.four_sharing} type="number" icon={DollarSign} />
              <EditableField label="Single Room" field="single_room" value={pg.single_room} type="number" icon={DollarSign} />
              <EditableField label="Double Room" field="double_room" value={pg.double_room} type="number" icon={DollarSign} />
              <EditableField label="Deposit Amount" field="deposit_amount" value={pg.deposit_amount} type="number" icon={DollarSign} />
              <EditableField label="Maintenance Amount" field="maintenance_amount" value={pg.maintenance_amount} type="number" icon={DollarSign} />
              {pg.pg_category === "to_let" && (
                <>
                  <EditableField label="1 BHK Price" field="price_1bhk" value={pg.price_1bhk} type="number" icon={DollarSign} />
                  <EditableField label="2 BHK Price" field="price_2bhk" value={pg.price_2bhk} type="number" icon={DollarSign} />
                  <EditableField label="3 BHK Price" field="price_3bhk" value={pg.price_3bhk} type="number" icon={DollarSign} />
                </>
              )}
              {pg.pg_category === "coliving" && (
                <>
                  <EditableField label="Co-Living Single Room" field="co_living_single_room" value={pg.co_living_single_room} type="number" icon={DollarSign} />
                  <EditableField label="Co-Living Double Room" field="co_living_double_room" value={pg.co_living_double_room} type="number" icon={DollarSign} />
                </>
              )}
            </Section>
          )}

          {/* Amenities Tab */}
          {activeTab === "amenities" && (
            <Section title="Amenities & Facilities" icon={Shield}>
              <div className="col-span-full">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <AmenityBadge label="WiFi" value={isTrueValue(pg.wifi_available)} />
                  <AmenityBadge label="AC" value={isTrueValue(pg.ac_available)} />
                  <AmenityBadge label="Food Available" value={isTrueValue(pg.food_available)} />
                  <AmenityBadge label="Parking" value={isTrueValue(pg.parking_available)} />
                  <AmenityBadge label="Bike Parking" value={isTrueValue(pg.bike_parking)} />
                  <AmenityBadge label="Laundry" value={isTrueValue(pg.laundry_available)} />
                  <AmenityBadge label="Washing Machine" value={isTrueValue(pg.washing_machine)} />
                  <AmenityBadge label="Refrigerator" value={isTrueValue(pg.refrigerator)} />
                  <AmenityBadge label="Microwave" value={isTrueValue(pg.microwave)} />
                  <AmenityBadge label="Geyser" value={isTrueValue(pg.geyser)} />
                  <AmenityBadge label="Power Backup" value={isTrueValue(pg.power_backup)} />
                  <AmenityBadge label="Lift/Elevator" value={isTrueValue(pg.lift_elevator)} />
                  <AmenityBadge label="CCTV" value={isTrueValue(pg.cctv)} />
                  <AmenityBadge label="Security Guard" value={isTrueValue(pg.security_guard)} />
                  <AmenityBadge label="Gym" value={isTrueValue(pg.gym)} />
                  <AmenityBadge label="Housekeeping" value={isTrueValue(pg.housekeeping)} />
                  <AmenityBadge label="Water Purifier" value={isTrueValue(pg.water_purifier)} />
                  <AmenityBadge label="Fire Safety" value={isTrueValue(pg.fire_safety)} />
                  <AmenityBadge label="Study Room" value={isTrueValue(pg.study_room)} />
                  <AmenityBadge label="TV Lounge" value={isTrueValue(pg.common_tv_lounge)} />
                  <AmenityBadge label="Balcony/Open Space" value={isTrueValue(pg.balcony_open_space)} />
                  <AmenityBadge label="24x7 Water" value={isTrueValue(pg.water_24x7)} />
                  <AmenityBadge label="Cupboard" value={isTrueValue(pg.cupboard_available)} />
                  <AmenityBadge label="Study Table" value={isTrueValue(pg.table_chair_available)} />
                  <AmenityBadge label="Attached Bathroom" value={isTrueValue(pg.attached_bathroom)} />
                  <AmenityBadge label="Bed with Mattress" value={isTrueValue(pg.bed_with_mattress)} />
                </div>
              </div>
            </Section>
          )}

          {/* Rules Tab */}
          {activeTab === "rules" && (
            <Section title="Rules & Restrictions" icon={Lock}>
              <div className="col-span-full">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <AmenityBadge label="Couple Allowed" value={isTrueValue(pg.couple_allowed)} />
                  <AmenityBadge label="Family Allowed" value={isTrueValue(pg.family_allowed)} />
                  <AmenityBadge label="Smoking Allowed" value={isTrueValue(pg.smoking_allowed)} />
                  <AmenityBadge label="Drinking Allowed" value={isTrueValue(pg.drinking_allowed)} />
                  <AmenityBadge label="Pets Allowed" value={isTrueValue(pg.pets_allowed)} />
                  <AmenityBadge label="Visitors Allowed" value={isTrueValue(pg.visitor_allowed)} />
                  <AmenityBadge label="Visitor Time Restricted" value={isTrueValue(pg.visitor_time_restricted)} />
                  <AmenityBadge label="Late Night Entry" value={isTrueValue(pg.late_night_entry_allowed)} />
                  <AmenityBadge label="Outside Food Allowed" value={isTrueValue(pg.outside_food_allowed)} />
                  <AmenityBadge label="Parties Allowed" value={isTrueValue(pg.parties_allowed)} />
                  <AmenityBadge label="Loud Music Restricted" value={isTrueValue(pg.loud_music_restricted)} />
                  <AmenityBadge label="Lock-in Period" value={isTrueValue(pg.lock_in_period)} />
                  <AmenityBadge label="Agreement Mandatory" value={isTrueValue(pg.agreement_mandatory)} />
                  <AmenityBadge label="ID Proof Required" value={isTrueValue(pg.id_proof_mandatory)} />
                  <AmenityBadge label="Office Going Only" value={isTrueValue(pg.office_going_only)} />
                  <AmenityBadge label="Students Only" value={isTrueValue(pg.students_only)} />
                  <AmenityBadge label="Boys Only" value={isTrueValue(pg.boys_only)} />
                  <AmenityBadge label="Girls Only" value={isTrueValue(pg.girls_only)} />
                  <AmenityBadge label="Co-Living" value={isTrueValue(pg.co_living_allowed)} />
                  <AmenityBadge label="Subletting Allowed" value={isTrueValue(pg.subletting_allowed)} />
                </div>
                {pg.visitors_allowed_till && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm"><strong>Visitors Allowed Till:</strong> {pg.visitors_allowed_till}</p>
                  </div>
                )}
                {pg.entry_curfew_time && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm"><strong>Entry Curfew Time:</strong> {pg.entry_curfew_time}</p>
                  </div>
                )}
                {pg.min_stay_months > 0 && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm"><strong>Minimum Stay:</strong> {pg.min_stay_months} months</p>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Media Tab */}
          {activeTab === "media" && (
            <Section title="Photos" icon={Camera}>
              <div className="col-span-full">
                {/* Upload New Photos */}
                <div className="mb-6">
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-all">
                    <Plus size={16} />
                    Add Photos
                    <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
                  </label>
                  {uploading && <span className="ml-3 text-sm text-gray-500">Uploading...</span>}
                  <p className="text-xs text-gray-500 mt-2">Maximum 10 photos allowed</p>
                </div>

                {/* Existing Photos */}
                {pg.photos && pg.photos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {pg.photos.map((img, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={`${FILES_BASE}${img}`}
                          alt={`Property ${i + 1}`}
                          className="h-48 w-full object-cover rounded-xl cursor-pointer transition-transform duration-300 group-hover:scale-105"
                          onClick={() => setSelectedPhoto(img)}
                        />
                        <button
                          onClick={() => handleDeletePhoto(img)}
                          className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                          title="Remove photo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Camera size={48} className="text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No photos uploaded</p>
                  </div>
                )}

                {/* Videos Section */}
                {pg.videos && pg.videos.length > 0 && (
                  <div className="mt-8">
                    <h4 className="font-semibold text-gray-800 mb-4 text-lg flex items-center gap-2">
                      <Video size={18} />
                      Videos
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pg.videos.map((video, i) => (
                        <video key={i} controls className="w-full rounded-xl shadow-md">
                          <source src={`${FILES_BASE}${video}`} type="video/mp4" />
                        </video>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* System Tab */}
          {activeTab === "system" && (
            <Section title="System Information" icon={Calendar}>
              <InfoCard label="Status" value={pg.status} icon={Clock} />
              <InfoCard label="Created At" value={pg.created_at ? new Date(pg.created_at).toLocaleString() : "—"} icon={Calendar} />
              <InfoCard label="Updated At" value={pg.updated_at ? new Date(pg.updated_at).toLocaleString() : "—"} icon={Calendar} />
              <InfoCard label="Is Deleted" value={pg.is_deleted ? "Yes" : "No"} icon={XCircle} />
            </Section>
          )}

          {/* Action Footer - Only show for pending properties */}
          {pg.status === "pending" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowReject(true)}
                  className="px-6 py-2.5 rounded-xl border-2 border-red-200 text-red-600 font-semibold hover:bg-red-50 hover:border-red-300 transition-all"
                >
                  <ThumbsDown size={18} className="inline mr-2" />
                  Reject
                </button>
                <button
                  onClick={handleApprove}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-2.5 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 shadow-md transition-all"
                >
                  <ThumbsUp size={18} className="inline mr-2" />
                  Approve Listing
                </button>
              </div>
            </div>
          )}
        </div>
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

export default AdminPGDetails;