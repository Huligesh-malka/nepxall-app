// AdminPGDetails.js - Complete with ALL fields editable
import React, { useEffect, useState, useCallback } from "react";
import { useParams, Navigate } from "react-router-dom";
import { adminPGAPI } from "../../api/api";
import { API_CONFIG } from "../../config";
import { useAuth } from "../../context/AuthContext";
import {
  CheckCircle,
  XCircle,
  Clock,
  Edit2,
  Save,
  X,
  MapPin,
  Phone,
  Mail,
  User,
  Building,
  DollarSign,
  Home,
  Image,
  Video,
  Info,
  Shield,
  AlertTriangle,
  ChevronLeft,
  ExternalLink,
  Layers,
  Bed,
  Bath,
  Wifi,
  Wind,
  Coffee,
  Car,
  ShieldCheck,
  Tv,
  Zap,
  Thermometer,
  Lock,
  Users,
  PawPrint,
  Music,
  Clock as ClockIcon,
  FileText,
  Calendar,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Maximize2,
  Loader2,
  Trash2,
  Upload,
  Utensils,
  Dumbbell,
  Droplets,
  Flame,
  Key,
  DoorOpen,
  Radio
} from "lucide-react";

const FILES_BASE =
  API_CONFIG?.FILES_URL ||
  "https://nepxall-backend.onrender.com";

// Correct image URL function
const getCorrectImageUrl = (path) => {
  if (!path) {
    return "https://via.placeholder.com/400x300?text=No+Image";
  }

  if (path.startsWith("http")) {
    return path;
  }

  if (path.includes("/uploads/")) {
    const uploadsIndex = path.indexOf("/uploads/");
    if (uploadsIndex !== -1) {
      const relativePath = path.substring(uploadsIndex);
      return `${FILES_BASE}${relativePath}`;
    }
  }

  if (path.includes("/opt/render/")) {
    const uploadsMatch = path.match(/\/uploads\/.*/);
    if (uploadsMatch) {
      return `${FILES_BASE}${uploadsMatch[0]}`;
    }
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${FILES_BASE}${normalizedPath}`;
};

const AdminPGDetails = () => {
  const { id } = useParams();
  const { user, role, loading: authLoading } = useAuth();

  const [pg, setPG] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    pricing: true,
    roomDetails: true,
    location: true,
    amenities: true,
    rules: true,
    contact: true,
    bhkDetails: true,
    coLiving: true,
    minStay: true,
    system: true
  });

  const loadPG = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminPGAPI.getPGById(id);
      const data = res.data.data;
      setPG(data);
      setPhotos(Array.isArray(data.photos) ? data.photos : []);
      setVideos(Array.isArray(data.videos) ? data.videos : []);
    } catch (err) {
      console.error("Load PG error:", err);
      showNotification("Failed to load PG details", "error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading && user && role === "admin") {
      loadPG();
    }
  }, [loadPG, authLoading, user, role]);

  const showNotification = (message, type = "success") => {
    setSuccessMessage(message);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const uploadPhotos = async (e) => {
    try {
      const files = e.target.files;
      if (!files.length) return;

      setUploading(true);
      const formData = new FormData();
      for (let file of files) {
        formData.append("photos", file);
      }

      const token = localStorage.getItem("token");
      const res = await fetch(`${FILES_BASE}/api/admin/pg/${id}/photos`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        showNotification("Photos uploaded successfully");
        loadPG();
      } else {
        showNotification(data.message || "Upload failed", "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photo) => {
    if (!window.confirm("Delete this photo?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${FILES_BASE}/api/admin/pg/${id}/photo`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ photo: photo }),
      });

      const data = await res.json();
      if (data.success) {
        showNotification("Photo deleted");
        loadPG();
      } else {
        showNotification(data.message || "Delete failed", "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("Delete failed", "error");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Verifying Admin Permissions...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role !== "admin") return <Navigate to="/" replace />;

  const approve = async () => {
    if (!window.confirm("Are you sure you want to approve this property? It will go live immediately.")) return;
    try {
      setActionLoading(true);
      await adminPGAPI.approvePG(id);
      showNotification("Property approved successfully!", "success");
      await loadPG();
    } catch (err) {
      console.error("Approval failed:", err);
      showNotification("Approval failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const reject = async () => {
    if (!rejectReason.trim()) {
      showNotification("Please enter a rejection reason for the owner.", "error");
      return;
    }
    try {
      setActionLoading(true);
      await adminPGAPI.rejectPG(id, rejectReason);
      setShowReject(false);
      setRejectReason("");
      showNotification("Property rejected and owner notified.", "success");
      await loadPG();
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (field, currentValue) => {
    setEditingField(field);
    // Handle boolean values properly
    let displayValue = currentValue;
    if (typeof currentValue === 'boolean') {
      displayValue = currentValue ? "true" : "false";
    } else if (currentValue === undefined || currentValue === null) {
      displayValue = "";
    } else {
      displayValue = String(currentValue);
    }
    setEditValue(displayValue);
  };

  const saveEdit = async () => {
    if (!editingField) return;
    try {
      setSaving(true);
      let valueToSend = editValue;

      // Handle empty values
      if (editValue === "" || editValue === "—" || editValue === null) {
        valueToSend = null;
      }

      // Convert boolean strings to proper boolean
      if (editValue === "true" || editValue === "false") {
        valueToSend = editValue === "true";
      }

      // Convert numeric strings to numbers
      const numericFields = [
        "single_sharing", "double_sharing", "triple_sharing", "four_sharing",
        "single_room", "double_room", "triple_room", "price_1bhk", "price_2bhk", 
        "price_3bhk", "price_4bhk", "co_living_single_room", "co_living_double_room",
        "coliving_three_sharing", "coliving_four_sharing", "deposit_amount", 
        "maintenance_amount", "rent_amount", "bedrooms_1bhk", "bathrooms_1bhk",
        "bedrooms_2bhk", "bathrooms_2bhk", "bedrooms_3bhk", "bathrooms_3bhk",
        "bedrooms_4bhk", "bathrooms_4bhk", "min_stay_days", "min_stay_months",
        "lock_in_period", "notice_period", "total_rooms", "available_rooms", 
        "meals_per_day", "pincode", "latitude", "longitude"
      ];

      if (numericFields.includes(editingField) && editValue && editValue !== "") {
        const numValue = Number(editValue);
        if (!isNaN(numValue)) {
          valueToSend = numValue;
        }
      }

      await adminPGAPI.updatePGField(id, editingField, valueToSend);
      showNotification(`${editingField.replace(/_/g, ' ')} updated successfully`, "success");
      setEditingField(null);
      setEditValue("");
      await loadPG();
    } catch (err) {
      console.error("Update failed:", err);
      showNotification("Update failed. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return "—";
    return `₹${Number(value).toLocaleString("en-IN")}`;
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'active':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Active' };
      case 'pending':
        return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Pending Review' };
      case 'rejected':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Rejected' };
      default:
        return { icon: Info, color: 'text-gray-600', bg: 'bg-gray-50', label: status };
    }
  };

  const StatusBadge = ({ status }) => {
    const config = getStatusConfig(status);
    const Icon = config.icon;
    return (
      <div className={`${config.bg} ${config.color} px-4 py-2 rounded-full flex items-center gap-2 font-semibold text-sm`}>
        <Icon size={16} />
        <span>{config.label}</span>
      </div>
    );
  };

  const EditableField = ({ label, field, value, type = "text", icon: Icon, options = null, placeholder = "" }) => {
    const isEditing = editingField === field;
    let displayValue = value !== undefined && value !== null ? value : "—";
    
    // Format display value based on type
    if (!isEditing) {
      if (type === "currency" && value && value !== "—") {
        displayValue = formatCurrency(value);
      } else if (type === "boolean") {
        displayValue = value ? "Yes" : "No";
      } else if (type === "percentage" && value) {
        displayValue = `${value}%`;
      }
    }

    if (isEditing) {
      return (
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 mb-2">
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
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : type === "textarea" ? (
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder={placeholder}
                  autoFocus
                />
              ) : type === "boolean" ? (
                <select
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              ) : (
                <input
                  type={type === "number" || type === "currency" ? "text" : type}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-40 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={placeholder}
                  autoFocus
                />
              )}
              <button
                onClick={saveEdit}
                disabled={saving}
                className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-all text-sm font-medium disabled:opacity-50 flex items-center gap-1"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save
              </button>
              <button
                onClick={cancelEdit}
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
            onClick={() => handleEdit(field, value)}
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

  const Section = ({ title, icon: Icon, children, sectionKey }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={20} className="text-blue-600" />}
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        <ChevronLeft 
          size={20} 
          className={`transform transition-transform ${expandedSections[sectionKey] ? "rotate-90" : "-rotate-90"}`}
        />
      </button>
      {expandedSections[sectionKey] && (
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-2">{children}</div>
        </div>
      )}
    </div>
  );

  const AmenityBadge = ({ label, value }) => {
    const isAvailable = value === true || value === 1 || value === "1" || value === "true";
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-400'}`}>
        {isAvailable ? <CheckCircle size={14} /> : <XCircle size={14} />}
        <span>{label}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!pg) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Building size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No property found with ID: {id}</p>
        </div>
      </div>
    );
  }

  const validPhotos = photos.filter(
    (photo) =>
      photo &&
      typeof photo === "string" &&
      !photo.includes("fakepath")
  );

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

      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="relative max-w-4xl w-full">
            <img src={getCorrectImageUrl(selectedPhoto)} alt="Full size" className="w-full h-auto rounded-xl" />
            <button onClick={() => setSelectedPhoto(null)} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-all">
              <X size={24} />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => window.history.back()}
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
              <StatusBadge status={pg.status} />
            </div>
          </div>
        </div>

        {/* Owner Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <InfoCard label="Owner" value={pg.owner_name} icon={User} />
          <InfoCard label="Phone" value={pg.owner_phone} icon={Phone} />
          <InfoCard label="Email" value={pg.owner_email} icon={Mail} />
          <InfoCard label="Location" value={`${pg.city || ""}, ${pg.area || ""}`} icon={MapPin} />
        </div>

        <div className="space-y-6">
          {/* Basic Information Section */}
          <Section title="Basic Information" icon={Info} sectionKey="basic">
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
                { value: "co-living", label: "Co-Living" },
                { value: "family", label: "Family" }
              ]}
            />
            <EditableField 
              label="Type" 
              field="pg_type" 
              value={pg.pg_type}
              icon={Home}
              options={[
                { value: "normal", label: "Normal" },
                { value: "luxury", label: "Luxury" },
                { value: "premium", label: "Premium" }
              ]}
            />
            <EditableField label="Status" field="status" value={pg.status} icon={Clock} 
              options={[
                { value: "pending", label: "Pending" },
                { value: "active", label: "Active" },
                { value: "rejected", label: "Rejected" },
                { value: "inactive", label: "Inactive" }
              ]}
            />
            <EditableField label="City" field="city" value={pg.city} icon={MapPin} />
            <EditableField label="Area / Locality" field="area" value={pg.area} icon={MapPin} />
            <EditableField label="Complete Address" field="address" value={pg.address} icon={MapPin} type="textarea" />
            <EditableField label="Landmark" field="landmark" value={pg.landmark} icon={MapPin} />
            <EditableField label="Pincode" field="pincode" value={pg.pincode} type="number" icon={MapPin} />
            <EditableField label="State" field="state" value={pg.state} icon={MapPin} />
            <EditableField label="Country" field="country" value={pg.country} icon={MapPin} />
            <EditableField label="Road/Lane" field="road" value={pg.road} icon={MapPin} />
          </Section>

          {/* Contact Information Section */}
          <Section title="Contact Information" icon={Phone} sectionKey="contact">
            <EditableField label="Contact Person" field="contact_person" value={pg.contact_person} icon={User} />
            <EditableField label="Contact Phone" field="contact_phone" value={pg.contact_phone} icon={Phone} />
            <EditableField label="Contact Email" field="contact_email" value={pg.contact_email} icon={Mail} />
          </Section>

          {/* Pricing Details Section - COMPLETE */}
          <Section title="Pricing Details" icon={DollarSign} sectionKey="pricing">
            <EditableField label="Single Sharing" field="single_sharing" value={pg.single_sharing} type="currency" icon={DollarSign} />
            <EditableField label="Double Sharing" field="double_sharing" value={pg.double_sharing} type="currency" icon={DollarSign} />
            <EditableField label="Triple Sharing" field="triple_sharing" value={pg.triple_sharing} type="currency" icon={DollarSign} />
            <EditableField label="Four Sharing" field="four_sharing" value={pg.four_sharing} type="currency" icon={DollarSign} />
            <EditableField label="Single Room" field="single_room" value={pg.single_room} type="currency" icon={Home} />
            <EditableField label="Double Room" field="double_room" value={pg.double_room} type="currency" icon={Home} />
            <EditableField label="Triple Room" field="triple_room" value={pg.triple_room} type="currency" icon={Home} />
            <EditableField label="1 BHK" field="price_1bhk" value={pg.price_1bhk} type="currency" icon={Building} />
            <EditableField label="2 BHK" field="price_2bhk" value={pg.price_2bhk} type="currency" icon={Building} />
            <EditableField label="3 BHK" field="price_3bhk" value={pg.price_3bhk} type="currency" icon={Building} />
            <EditableField label="4 BHK" field="price_4bhk" value={pg.price_4bhk} type="currency" icon={Building} />
            <EditableField label="Deposit Amount" field="deposit_amount" value={pg.deposit_amount} type="currency" icon={DollarSign} />
            <EditableField label="Maintenance Amount" field="maintenance_amount" value={pg.maintenance_amount} type="currency" icon={DollarSign} />
            <EditableField label="Rent Amount" field="rent_amount" value={pg.rent_amount} type="currency" icon={DollarSign} />
          </Section>

          {/* BHK Details Section */}
          <Section title="BHK Details" icon={Building} sectionKey="bhkDetails">
            <EditableField label="BHK Type" field="bhk_type" value={pg.bhk_type} icon={Building} 
              options={[
                { value: "1bhk", label: "1 BHK" },
                { value: "2bhk", label: "2 BHK" },
                { value: "3bhk", label: "3 BHK" },
                { value: "4bhk", label: "4 BHK" }
              ]}
            />
            <EditableField label="Furnishing Type" field="furnishing_type" value={pg.furnishing_type} icon={Home}
              options={[
                { value: "fully_furnished", label: "Fully Furnished" },
                { value: "semi_furnished", label: "Semi Furnished" },
                { value: "unfurnished", label: "Unfurnished" }
              ]}
            />
            <EditableField label="1 BHK Bedrooms" field="bedrooms_1bhk" value={pg.bedrooms_1bhk} type="number" icon={Bed} />
            <EditableField label="1 BHK Bathrooms" field="bathrooms_1bhk" value={pg.bathrooms_1bhk} type="number" icon={Bath} />
            <EditableField label="2 BHK Bedrooms" field="bedrooms_2bhk" value={pg.bedrooms_2bhk} type="number" icon={Bed} />
            <EditableField label="2 BHK Bathrooms" field="bathrooms_2bhk" value={pg.bathrooms_2bhk} type="number" icon={Bath} />
            <EditableField label="3 BHK Bedrooms" field="bedrooms_3bhk" value={pg.bedrooms_3bhk} type="number" icon={Bed} />
            <EditableField label="3 BHK Bathrooms" field="bathrooms_3bhk" value={pg.bathrooms_3bhk} type="number" icon={Bath} />
            <EditableField label="4 BHK Bedrooms" field="bedrooms_4bhk" value={pg.bedrooms_4bhk} type="number" icon={Bed} />
            <EditableField label="4 BHK Bathrooms" field="bathrooms_4bhk" value={pg.bathrooms_4bhk} type="number" icon={Bath} />
          </Section>

          {/* Room Details Section */}
          <Section title="Room Details" icon={Bed} sectionKey="roomDetails">
            <EditableField label="Total Rooms" field="total_rooms" value={pg.total_rooms} type="number" icon={Home} />
            <EditableField label="Available Rooms" field="available_rooms" value={pg.available_rooms} type="number" icon={Home} />
            <EditableField label="Cupboard Available" field="cupboard_available" value={pg.cupboard_available} type="boolean" icon={DoorOpen} />
            <EditableField label="Table & Chair" field="table_chair_available" value={pg.table_chair_available} type="boolean" icon={Chair} />
            <EditableField label="Dining Table" field="dining_table_available" value={pg.dining_table_available} type="boolean" icon={Utensils} />
            <EditableField label="Attached Bathroom" field="attached_bathroom" value={pg.attached_bathroom} type="boolean" icon={Bath} />
            <EditableField label="Balcony Available" field="balcony_available" value={pg.balcony_available} type="boolean" icon={Home} />
            <EditableField label="Bed with Mattress" field="bed_with_mattress" value={pg.bed_with_mattress} type="boolean" icon={Bed} />
            <EditableField label="Fan & Light" field="fan_light" value={pg.fan_light} type="boolean" icon={Zap} />
            <EditableField label="Kitchen Room" field="kitchen_room" value={pg.kitchen_room} type="boolean" icon={Utensils} />
          </Section>

          {/* Co-Living Details Section */}
          <Section title="Co-Living Details" icon={Users} sectionKey="coLiving">
            <EditableField label="Co-Living Single Room" field="co_living_single_room" value={pg.co_living_single_room} type="currency" icon={DollarSign} />
            <EditableField label="Co-Living Double Room" field="co_living_double_room" value={pg.co_living_double_room} type="currency" icon={DollarSign} />
            <EditableField label="Co-Living 3 Sharing" field="coliving_three_sharing" value={pg.coliving_three_sharing} type="currency" icon={Users} />
            <EditableField label="Co-Living 4 Sharing" field="coliving_four_sharing" value={pg.coliving_four_sharing} type="currency" icon={Users} />
            <EditableField label="Fully Furnished" field="co_living_fully_furnished" value={pg.co_living_fully_furnished} type="boolean" icon={Home} />
            <EditableField label="Food Included" field="co_living_food_included" value={pg.co_living_food_included} type="boolean" icon={Utensils} />
            <EditableField label="WiFi Included" field="co_living_wifi_included" value={pg.co_living_wifi_included} type="boolean" icon={Wifi} />
            <EditableField label="Housekeeping Included" field="co_living_housekeeping" value={pg.co_living_housekeeping} type="boolean" icon={ShieldCheck} />
            <EditableField label="Power Backup Included" field="co_living_power_backup" value={pg.co_living_power_backup} type="boolean" icon={Zap} />
            <EditableField label="Maintenance Included" field="co_living_maintenance" value={pg.co_living_maintenance} type="boolean" icon={DollarSign} />
          </Section>

          {/* Minimum Stay Section */}
          <Section title="Minimum Stay" icon={ClockIcon} sectionKey="minStay">
            <EditableField label="Min Stay Available" field="min_stay_available" value={pg.min_stay_available} type="boolean" icon={ClockIcon} />
            <EditableField label="Min Stay Days" field="min_stay_days" value={pg.min_stay_days} type="number" icon={Calendar} />
            <EditableField label="Min Stay Months" field="min_stay_months" value={pg.min_stay_months} type="number" icon={Calendar} />
            <EditableField label="Lock-in Period" field="lock_in_period" value={pg.lock_in_period} type="number" icon={Lock} />
            <EditableField label="Notice Period" field="notice_period" value={pg.notice_period} type="number" icon={Calendar} />
          </Section>

          {/* Food Details */}
          <Section title="Food Details" icon={Utensils} sectionKey="food">
            <EditableField label="Food Available" field="food_available" value={pg.food_available} type="boolean" icon={Utensils} />
            <EditableField label="Food Type" field="food_type" value={pg.food_type} icon={Utensils}
              options={[
                { value: "veg", label: "Vegetarian" },
                { value: "non-veg", label: "Non-Vegetarian" },
                { value: "both", label: "Both" }
              ]}
            />
            <EditableField label="Meals Per Day" field="meals_per_day" value={pg.meals_per_day} type="number" icon={Utensils} />
          </Section>

          {/* Location Section */}
          <Section title="Location Coordinates" icon={MapPin} sectionKey="location">
            <EditableField label="Latitude" field="latitude" value={pg.latitude} type="number" icon={MapPin} />
            <EditableField label="Longitude" field="longitude" value={pg.longitude} type="number" icon={MapPin} />
            {pg.latitude && pg.longitude && (
              <div className="col-span-full mt-2">
                <a
                  href={`https://www.google.com/maps?q=${pg.latitude},${pg.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  <ExternalLink size={16} />
                  View on Google Maps
                </a>
              </div>
            )}
          </Section>

          {/* Amenities & Facilities Section - COMPLETE */}
          <Section title="Amenities & Facilities" icon={ShieldCheck} sectionKey="amenities">
            <div className="col-span-full">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <AmenityBadge label="WiFi" value={pg.wifi_available} />
                <AmenityBadge label="AC" value={pg.ac_available} />
                <AmenityBadge label="TV" value={pg.tv} />
                <AmenityBadge label="Parking" value={pg.parking_available} />
                <AmenityBadge label="Bike Parking" value={pg.bike_parking} />
                <AmenityBadge label="Laundry" value={pg.laundry_available} />
                <AmenityBadge label="Washing Machine" value={pg.washing_machine} />
                <AmenityBadge label="Refrigerator" value={pg.refrigerator} />
                <AmenityBadge label="Microwave" value={pg.microwave} />
                <AmenityBadge label="Geyser" value={pg.geyser} />
                <AmenityBadge label="Power Backup" value={pg.power_backup} />
                <AmenityBadge label="Lift/Elevator" value={pg.lift_elevator} />
                <AmenityBadge label="CCTV" value={pg.cctv} />
                <AmenityBadge label="Security Guard" value={pg.security_guard} />
                <AmenityBadge label="Gym" value={pg.gym} />
                <AmenityBadge label="Housekeeping" value={pg.housekeeping} />
                <AmenityBadge label="Water Purifier" value={pg.water_purifier} />
                <AmenityBadge label="Fire Safety" value={pg.fire_safety} />
                <AmenityBadge label="Study Room" value={pg.study_room} />
                <AmenityBadge label="Common TV Lounge" value={pg.common_tv_lounge} />
                <AmenityBadge label="Balcony/Open Space" value={pg.balcony_open_space} />
                <AmenityBadge label="24x7 Water" value={pg.water_24x7} />
                <AmenityBadge label="Water Type" value={pg.water_type} />
              </div>
            </div>
            <EditableField label="Water Type" field="water_type" value={pg.water_type} icon={Droplets}
              options={[
                { value: "borewell", label: "Borewell" },
                { value: "corporation", label: "Corporation" },
                { value: "both", label: "Both" }
              ]}
            />
          </Section>

          {/* Rules & Restrictions Section - COMPLETE */}
          <Section title="Rules & Restrictions" icon={Shield} sectionKey="rules">
            <div className="col-span-full">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <AmenityBadge label="Couple Allowed" value={pg.couple_allowed} />
                <AmenityBadge label="Family Allowed" value={pg.family_allowed} />
                <AmenityBadge label="Smoking Allowed" value={pg.smoking_allowed} />
                <AmenityBadge label="Drinking Allowed" value={pg.drinking_allowed} />
                <AmenityBadge label="Pets Allowed" value={pg.pets_allowed} />
                <AmenityBadge label="Visitors Allowed" value={pg.visitor_allowed} />
                <AmenityBadge label="Visitor Time Restricted" value={pg.visitor_time_restricted} />
                <AmenityBadge label="Late Night Entry" value={pg.late_night_entry_allowed} />
                <AmenityBadge label="Outside Food" value={pg.outside_food_allowed} />
                <AmenityBadge label="Parties Allowed" value={pg.parties_allowed} />
                <AmenityBadge label="Loud Music Restricted" value={pg.loud_music_restricted} />
                <AmenityBadge label="Agreement Mandatory" value={pg.agreement_mandatory} />
                <AmenityBadge label="ID Proof Mandatory" value={pg.id_proof_mandatory} />
                <AmenityBadge label="Office Going Only" value={pg.office_going_only} />
                <AmenityBadge label="Students Only" value={pg.students_only} />
                <AmenityBadge label="Boys Only" value={pg.boys_only} />
                <AmenityBadge label="Girls Only" value={pg.girls_only} />
                <AmenityBadge label="Co-Living Allowed" value={pg.co_living_allowed} />
                <AmenityBadge label="Subletting Allowed" value={pg.subletting_allowed} />
              </div>
            </div>
            <EditableField label="Visitors Allowed Till" field="visitors_allowed_till" value={pg.visitors_allowed_till} icon={ClockIcon} />
            <EditableField label="Entry Curfew Time" field="entry_curfew_time" value={pg.entry_curfew_time} icon={ClockIcon} />
          </Section>

          {/* Description Section */}
          <Section title="Description" icon={FileText} sectionKey="desc">
            <div className="col-span-full">
              <EditableField label="Description" field="description" value={pg.description} type="textarea" icon={FileText} />
            </div>
          </Section>

          {/* Photos Section */}
          <Section title="Photos" icon={Image} sectionKey="photos">
            <div className="col-span-full">
              <div className="mb-4">
                <label className="bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer inline-flex items-center gap-2 hover:bg-blue-700 transition-all">
                  {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                  {uploading ? "Uploading..." : "Upload Photos"}
                  <input
                    type="file"
                    multiple
                    hidden
                    accept="image/*"
                    onChange={uploadPhotos}
                    disabled={uploading}
                  />
                </label>
              </div>
              {validPhotos.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <Image size={48} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No photos uploaded</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {validPhotos.map((img, i) => (
                    <div key={i} className="relative group">
                      <div
                        onClick={() => setSelectedPhoto(img)}
                        className="cursor-pointer overflow-hidden rounded-xl"
                      >
                        <img
                          src={getCorrectImageUrl(img)}
                          alt={`Property ${i + 1}`}
                          className="h-48 w-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            console.error("Image failed:", img, getCorrectImageUrl(img));
                            e.target.src = "https://via.placeholder.com/400x300?text=Image+Error";
                          }}
                        />
                      </div>
                      <button
                        onClick={() => deletePhoto(img)}
                        className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>

          {/* Videos Section */}
          {videos.length > 0 && (
            <Section title="Videos" icon={Video} sectionKey="videos">
              <div className="col-span-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {videos.map((video, i) => (
                    <video key={i} controls className="w-full rounded-xl shadow-md">
                      <source src={getCorrectImageUrl(video)} type="video/mp4" />
                    </video>
                  ))}
                </div>
              </div>
            </Section>
          )}

          {/* System Information Section */}
          <Section title="System Information" icon={Calendar} sectionKey="system">
            <InfoCard label="Created At" value={pg.created_at ? new Date(pg.created_at).toLocaleString() : "—"} icon={Calendar} />
            <InfoCard label="Updated At" value={pg.updated_at ? new Date(pg.updated_at).toLocaleString() : "—"} icon={Calendar} />
            <InfoCard label="Approved At" value={pg.approved_at ? new Date(pg.approved_at).toLocaleString() : "—"} icon={CheckCircle} />
            <InfoCard label="Is Deleted" value={pg.is_deleted ? "Yes" : "No"} icon={Trash2} />
            {pg.rejection_reason && (
              <div className="col-span-full">
                <InfoCard label="Rejection Reason" value={pg.rejection_reason} icon={AlertTriangle} />
              </div>
            )}
          </Section>

          {/* Action Buttons for Pending Status */}
          {pg.status === "pending" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              {!showReject ? (
                <div className="flex justify-end gap-4">
                  <button
                    disabled={actionLoading}
                    onClick={() => setShowReject(true)}
                    className="px-6 py-2.5 rounded-xl border-2 border-red-200 text-red-600 font-semibold hover:bg-red-50 hover:border-red-300 transition-all disabled:opacity-50"
                  >
                    <ThumbsDown size={18} className="inline mr-2" />
                    Reject
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={approve}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-2.5 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <ThumbsUp size={18} />}
                    {actionLoading ? "Processing..." : "Approve Listing"}
                  </button>
                </div>
              ) : (
                <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle size={20} className="text-red-600" />
                    <h4 className="font-bold text-red-800 text-lg">Reject Property Listing</h4>
                  </div>
                  <textarea
                    placeholder="Explain why this property is being rejected (the owner will see this)..."
                    className="w-full border-2 border-red-200 rounded-xl p-4 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all h-32"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      onClick={() => setShowReject(false)}
                      className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={actionLoading}
                      onClick={reject}
                      className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {actionLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                      {actionLoading ? "Sending..." : "Submit Rejection"}
                    </button>
                  </div>
                </div>
              )}
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

// Chair icon component
const Chair = ({ size = 16, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M7 18v4m10-4v4M5 14h14v-4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v4Z" />
    <path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
  </svg>
);

export default AdminPGDetails;