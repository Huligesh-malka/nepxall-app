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
  Maximize2
} from "lucide-react";

const FILES_BASE =
  API_CONFIG?.FILES_URL ||
  "https://nepxall-backend.onrender.com";

const AdminPGDetails = () => {
  const { id } = useParams();
  const { user, role, loading: authLoading } = useAuth();

  const [pg, setPG] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

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
    setEditValue(currentValue !== undefined && currentValue !== null ? String(currentValue) : "");
  };

  const saveEdit = async () => {
    if (!editingField) return;
    try {
      setSaving(true);
      let valueToSend = editValue;
      const numericFields = [
        "single_sharing", "double_sharing", "triple_sharing",
        "deposit_amount", "maintenance_amount", "total_rooms",
        "total_beds", "available_rooms", "room_size"
      ];

      if (numericFields.includes(editingField)) {
        const cleanedValue = String(editValue).replace(/[^0-9.-]/g, '');
        valueToSend = cleanedValue && !isNaN(cleanedValue) ? Number(cleanedValue) : 0;
      }

      setPG(prev => ({ ...prev, [editingField]: valueToSend }));
      await adminPGAPI.updatePGField(id, editingField, valueToSend);
      showNotification(`${editingField.replace(/_/g, ' ')} updated successfully`, "success");
      await loadPG();
    } catch (err) {
      console.error("Update failed:", err);
      showNotification("Update failed. Please try again.", "error");
      await loadPG();
    } finally {
      setSaving(false);
      setEditingField(null);
      setEditValue("");
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return "—";
    return `₹${Number(value).toLocaleString("en-IN")}`;
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'approved':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Approved' };
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

  const EditableField = ({ label, field, value, type = "text", icon: Icon, options = null }) => {
    const isEditing = editingField === field;
    let displayValue = value !== undefined && value !== null ? value : "—";
    const isPriceField = field.includes("sharing") || field.includes("amount");
    
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
                  autoFocus
                />
              ) : (
                <input
                  type={type === "number" ? "text" : type}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-40 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              )}
              <button
                onClick={saveEdit}
                disabled={saving}
                className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-all text-sm font-medium disabled:opacity-50"
              >
                <Save size={14} className="inline mr-1" />
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
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

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <InfoCard label="Owner" value={pg.owner_name} icon={User} />
          <InfoCard label="Phone" value={pg.owner_phone} icon={Phone} />
          <InfoCard label="Email" value={pg.owner_email} icon={Mail} />
          <InfoCard label="Location" value={`${pg.city || ""}, ${pg.area || ""}`} icon={MapPin} />
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
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

          {/* Pricing Details */}
          <Section title="Pricing Details" icon={DollarSign}>
            <EditableField label="Single Sharing" field="single_sharing" value={pg.single_sharing} type="number" icon={DollarSign} />
            <EditableField label="Double Sharing" field="double_sharing" value={pg.double_sharing} type="number" icon={DollarSign} />
            <EditableField label="Triple Sharing" field="triple_sharing" value={pg.triple_sharing} type="number" icon={DollarSign} />
            <EditableField label="Deposit Amount" field="deposit_amount" value={pg.deposit_amount} type="number" icon={DollarSign} />
            <EditableField label="Maintenance" field="maintenance_amount" value={pg.maintenance_amount} type="number" icon={DollarSign} />
          </Section>

          {/* Room Details */}
          <Section title="Room Details" icon={Bed}>
            <EditableField label="Total Rooms" field="total_rooms" value={pg.total_rooms} type="number" icon={Home} />
            <EditableField label="Total Beds" field="total_beds" value={pg.total_beds} type="number" icon={Bed} />
            <EditableField label="Available Rooms" field="available_rooms" value={pg.available_rooms} type="number" icon={Home} />
            <EditableField label="Room Size (sq ft)" field="room_size" value={pg.room_size} type="number" icon={Maximize2} />
            <EditableField label="Bathroom Type" field="bathroom_type" value={pg.bathroom_type} icon={Bath} />
            <EditableField label="Balcony" field="balcony" value={pg.balcony} icon={Home} />
          </Section>

          {/* Location */}
          <Section title="Location" icon={MapPin}>
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

          {/* Amenities */}
          <Section title="Amenities & Facilities" icon={ShieldCheck}>
            <div className="col-span-full">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <AmenityBadge label="WiFi" value={pg.wifi_available} />
                <AmenityBadge label="AC" value={pg.ac_available} />
                <AmenityBadge label="Food" value={pg.food_available} />
                <AmenityBadge label="Parking" value={pg.parking_available} />
                <AmenityBadge label="Bike Parking" value={pg.bike_parking} />
                <AmenityBadge label="Laundry" value={pg.laundry_available} />
                <AmenityBadge label="Washing Machine" value={pg.washing_machine} />
                <AmenityBadge label="Refrigerator" value={pg.refrigerator} />
                <AmenityBadge label="Microwave" value={pg.microwave} />
                <AmenityBadge label="Geyser" value={pg.geyser} />
                <AmenityBadge label="Power Backup" value={pg.power_backup} />
                <AmenityBadge label="Lift" value={pg.lift_elevator} />
                <AmenityBadge label="CCTV" value={pg.cctv} />
                <AmenityBadge label="Security" value={pg.security_guard} />
                <AmenityBadge label="Gym" value={pg.gym} />
                <AmenityBadge label="Housekeeping" value={pg.housekeeping} />
                <AmenityBadge label="Water Purifier" value={pg.water_purifier} />
                <AmenityBadge label="Fire Safety" value={pg.fire_safety} />
                <AmenityBadge label="Study Room" value={pg.study_room} />
                <AmenityBadge label="TV Lounge" value={pg.common_tv_lounge} />
                <AmenityBadge label="Balcony" value={pg.balcony_open_space} />
                <AmenityBadge label="24x7 Water" value={pg.water_24x7} />
              </div>
            </div>
          </Section>

          {/* Rules & Restrictions */}
          <Section title="Rules & Restrictions" icon={Shield}>
            <div className="col-span-full">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <AmenityBadge label="Couple Allowed" value={pg.couple_allowed} />
                <AmenityBadge label="Family Allowed" value={pg.family_allowed} />
                <AmenityBadge label="Smoking" value={pg.smoking_allowed} />
                <AmenityBadge label="Drinking" value={pg.drinking_allowed} />
                <AmenityBadge label="Pets" value={pg.pets_allowed} />
                <AmenityBadge label="Visitors" value={pg.visitor_allowed} />
                <AmenityBadge label="Visitor Time Restriction" value={pg.visitor_time_restricted} />
                <AmenityBadge label="Late Night Entry" value={pg.late_night_entry_allowed} />
                <AmenityBadge label="Outside Food" value={pg.outside_food_allowed} />
                <AmenityBadge label="Parties" value={pg.parties_allowed} />
                <AmenityBadge label="Loud Music Restriction" value={pg.loud_music_restricted} />
                <AmenityBadge label="Lock-in Period" value={pg.lock_in_period} />
                <AmenityBadge label="Agreement Mandatory" value={pg.agreement_mandatory} />
                <AmenityBadge label="ID Proof Required" value={pg.id_proof_mandatory} />
                <AmenityBadge label="Office Going Only" value={pg.office_going_only} />
                <AmenityBadge label="Students Only" value={pg.students_only} />
                <AmenityBadge label="Boys Only" value={pg.boys_only} />
                <AmenityBadge label="Girls Only" value={pg.girls_only} />
                <AmenityBadge label="Co-Living" value={pg.co_living_allowed} />
                <AmenityBadge label="Subletting" value={pg.subletting_allowed} />
              </div>
            </div>
          </Section>

          {/* Description */}
          <Section title="Description" icon={FileText}>
            <div className="col-span-full">
              <EditableField label="Description" field="description" value={pg.description} type="textarea" />
            </div>
          </Section>

          {/* Photos */}
          <Section title="Photos" icon={Image}>
            <div className="col-span-full">
              {photos.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <Image size={48} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No photos uploaded</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {photos.map((img, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedPhoto(img)}
                      className="cursor-pointer overflow-hidden rounded-xl group"
                    >
                      <img
                        src={`${FILES_BASE}${img}`}
                        alt={`Property ${i + 1}`}
                        className="h-48 w-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>

          {/* Videos */}
          {videos.length > 0 && (
            <Section title="Videos" icon={Video}>
              <div className="col-span-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {videos.map((video, i) => (
                    <video key={i} controls className="w-full rounded-xl shadow-md">
                      <source src={`${FILES_BASE}${video}`} type="video/mp4" />
                    </video>
                  ))}
                </div>
              </div>
            </Section>
          )}

          {/* System Info */}
          <Section title="System Information" icon={Calendar}>
            <InfoCard label="Status" value={pg.status} icon={Clock} />
            <InfoCard label="Created" value={pg.created_at ? new Date(pg.created_at).toLocaleString() : "—"} icon={Calendar} />
            <InfoCard label="Updated" value={pg.updated_at ? new Date(pg.updated_at).toLocaleString() : "—"} icon={Calendar} />
            <InfoCard label="Deleted" value={pg.is_deleted ? "Yes" : "No"} icon={TrashIcon} />
          </Section>

          {/* Action Footer */}
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
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-2.5 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 shadow-md transition-all disabled:opacity-50"
                  >
                    {actionLoading ? "Processing..." : (
                      <>
                        <ThumbsUp size={18} className="inline mr-2" />
                        Approve Listing
                      </>
                    )}
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
                      className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-all disabled:opacity-50"
                    >
                      {actionLoading ? "Sending..." : "Submit Rejection"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
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

// Helper component for trash icon
const TrashIcon = ({ size = 16, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 4V3c0-1 1-2 2-2h4c1 0 2 1 2 2v1" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export default AdminPGDetails;