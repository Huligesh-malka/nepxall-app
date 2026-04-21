import React, { useEffect, useState, useCallback } from "react";
import { useParams, Navigate } from "react-router-dom";
import { adminPGAPI } from "../../api/api";
import { API_CONFIG } from "../../config";
import { useAuth } from "../../context/AuthContext";

const FILES_BASE =
  API_CONFIG?.FILES_URL ||
  "https://nepxall-backend.onrender.com";

const AdminPGDetails = () => {
  const { id } = useParams();

  // ✅ 1. Get Auth State
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

  /* ================= LOAD PG ================= */
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
      alert("Failed to load PG details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  /* ================= EFFECT ================= */
  useEffect(() => {
    if (!authLoading && user && role === "admin") {
      loadPG();
    }
  }, [loadPG, authLoading, user, role]);

  /* ================= ROUTE PROTECTION ================= */
  if (authLoading) {
    return <div className="p-10 text-center font-semibold text-gray-500">Verifying Admin Permissions...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }

  /* ================= ACTIONS ================= */
  const approve = async () => {
    if (!window.confirm("Are you sure you want to approve this property? It will go live immediately.")) return;

    try {
      setActionLoading(true);
      await adminPGAPI.approvePG(id);
      alert("Property approved successfully!");
      await loadPG();
    } catch (err) {
      console.error("Approval failed:", err);
      alert("Approval failed");
    } finally {
      setActionLoading(false);
    }
  };

  const reject = async () => {
    if (!rejectReason.trim()) return alert("Please enter a rejection reason for the owner.");

    try {
      setActionLoading(true);
      await adminPGAPI.rejectPG(id, rejectReason);
      setShowReject(false);
      setRejectReason("");
      alert("Property rejected and owner notified.");
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
      // Optimistic update
      setPG(prev => ({ ...prev, [editingField]: editValue }));
      await adminPGAPI.updatePGField(id, editingField, editValue);
      alert(`${editingField} updated successfully`);
      await loadPG(); // refresh to ensure sync
    } catch (err) {
      console.error("Update failed:", err);
      alert("Update failed. Please try again.");
      await loadPG(); // revert on error
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

  /* ================= HELPER ================= */
  const formatCurrency = (value) => {
    if (!value && value !== 0) return "—";
    return `₹${Number(value).toLocaleString("en-IN")}`;
  };

  const formatBoolean = (value) => {
    if (value === true || value === 1 || value === "1") return "✅ Yes";
    if (value === false || value === 0 || value === "0") return "❌ No";
    return "—";
  };

  /* ================= RENDER EDITABLE FIELD ================= */
  const EditableRow = ({ label, field, value, type = "text", options = null }) => {
    const isEditing = editingField === field;
    const displayValue = value !== undefined && value !== null ? value : "—";

    if (isEditing) {
      return (
        <div className="flex justify-between items-center border-b border-gray-100 py-2">
          <span className="text-gray-500 text-sm font-medium">{label}</span>
          <div className="flex items-center gap-2">
            {options ? (
              <select
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                {options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                type={type}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="border rounded px-2 py-1 text-sm w-40"
                autoFocus
              />
            )}
            <button
              onClick={saveEdit}
              disabled={saving}
              className="text-green-600 hover:text-green-800 text-xs font-semibold"
            >
              Save
            </button>
            <button
              onClick={cancelEdit}
              className="text-gray-500 hover:text-gray-700 text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-between items-center border-b border-gray-50 py-2 group">
        <span className="text-gray-500 text-sm font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-gray-800 font-semibold">{displayValue}</span>
          <button
            onClick={() => handleEdit(field, value)}
            className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
          >
            ✏️ Edit
          </button>
        </div>
      </div>
    );
  };

  const SimpleRow = ({ label, value }) => (
    <div className="flex justify-between items-center border-b border-gray-50 py-2">
      <span className="text-gray-500 text-sm font-medium">{label}</span>
      <span className="text-gray-800 font-semibold">{value !== undefined && value !== null ? value : "—"}</span>
    </div>
  );

  if (loading) return <div className="p-10 text-center">Fetching property details...</div>;
  if (!pg) return <div className="p-10 text-center">No property found with ID: {id}</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{pg.pg_name || "Unnamed Property"}</h1>
            <p className="text-gray-500 text-sm">Property ID: #{pg.id} | PG Code: {pg.pg_code || "—"}</p>
          </div>
          <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
            pg.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
            pg.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {pg.status}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-8">
          
          {/* 🏠 BASIC INFO */}
          <Section title="🏠 Basic Information">
            <EditableRow label="PG Name" field="pg_name" value={pg.pg_name} />
            <EditableRow label="PG Code" field="pg_code" value={pg.pg_code} />
            <EditableRow 
              label="Category" 
              field="pg_category" 
              value={pg.pg_category}
              options={[
                { value: "boys", label: "Boys" },
                { value: "girls", label: "Girls" },
                { value: "co-living", label: "Co-Living" }
              ]}
            />
            <EditableRow 
              label="Type" 
              field="pg_type" 
              value={pg.pg_type}
              options={[
                { value: "normal", label: "Normal" },
                { value: "luxury", label: "Luxury" }
              ]}
            />
            <EditableRow label="City" field="city" value={pg.city} />
            <EditableRow label="Area / Locality" field="area" value={pg.area} />
            <EditableRow label="Complete Address" field="address" value={pg.address} />
            <EditableRow label="Landmark" field="landmark" value={pg.landmark} />
            <EditableRow label="Pincode" field="pincode" value={pg.pincode} />
          </Section>

          {/* 👤 OWNER DETAILS (VERY IMPORTANT) */}
          <Section title="👤 Owner Details">
            <SimpleRow label="Owner Name" value={pg.owner_name} />
            <SimpleRow label="Phone Number" value={pg.owner_phone} />
            <SimpleRow label="Email Address" value={pg.owner_email} />
            <SimpleRow label="Owner ID (User ID)" value={pg.owner_id} />
          </Section>

          {/* 💰 PRICING */}
          <Section title="💰 Pricing Details">
            <EditableRow label="Single Sharing (Monthly)" field="single_sharing" value={formatCurrency(pg.single_sharing)} type="number" />
            <EditableRow label="Double Sharing (Monthly)" field="double_sharing" value={formatCurrency(pg.double_sharing)} type="number" />
            <EditableRow label="Triple Sharing (Monthly)" field="triple_sharing" value={formatCurrency(pg.triple_sharing)} type="number" />
            <EditableRow label="Deposit Amount" field="deposit_amount" value={formatCurrency(pg.deposit_amount)} type="number" />
            <EditableRow label="Maintenance Amount" field="maintenance_amount" value={formatCurrency(pg.maintenance_amount)} type="number" />
          </Section>

          {/* 📍 LOCATION */}
          <Section title="📍 Location">
            <SimpleRow label="Latitude" value={pg.latitude || "—"} />
            <SimpleRow label="Longitude" value={pg.longitude || "—"} />
            {pg.latitude && pg.longitude && (
              <div className="col-span-full mt-2">
                <a 
                  href={`https://www.google.com/maps?q=${pg.latitude},${pg.longitude}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  🔍 View on Google Maps
                </a>
              </div>
            )}
          </Section>

          {/* 🛏️ ROOM DETAILS */}
          <Section title="🛏️ Room Details">
            <EditableRow label="Total Rooms" field="total_rooms" value={pg.total_rooms} type="number" />
            <EditableRow label="Total Beds" field="total_beds" value={pg.total_beds} type="number" />
            <EditableRow label="Available Rooms" field="available_rooms" value={pg.available_rooms} type="number" />
            <EditableRow label="Room Size (sq ft)" field="room_size" value={pg.room_size} type="number" />
            <EditableRow label="Bathroom Type" field="bathroom_type" value={pg.bathroom_type || "—"} />
            <EditableRow label="Balcony" field="balcony" value={pg.balcony || "—"} />
          </Section>

          {/* ⚡ AMENITIES */}
          <Section title="⚡ Amenities & Facilities">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <AmenityBadge label="WiFi" value={pg.wifi_available} />
              <AmenityBadge label="AC" value={pg.ac_available} />
              <AmenityBadge label="Food Available" value={pg.food_available} />
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
            </div>
          </Section>

          {/* 🚫 RULES & RESTRICTIONS */}
          <Section title="🚫 Rules & Restrictions">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <AmenityBadge label="Couple Allowed" value={pg.couple_allowed} />
              <AmenityBadge label="Family Allowed" value={pg.family_allowed} />
              <AmenityBadge label="Smoking Allowed" value={pg.smoking_allowed} />
              <AmenityBadge label="Drinking Allowed" value={pg.drinking_allowed} />
              <AmenityBadge label="Pets Allowed" value={pg.pets_allowed} />
              <AmenityBadge label="Visitor Allowed" value={pg.visitor_allowed} />
              <AmenityBadge label="Visitor Time Restricted" value={pg.visitor_time_restricted} />
              <AmenityBadge label="Late Night Entry" value={pg.late_night_entry_allowed} />
              <AmenityBadge label="Outside Food Allowed" value={pg.outside_food_allowed} />
              <AmenityBadge label="Parties Allowed" value={pg.parties_allowed} />
              <AmenityBadge label="Loud Music Restricted" value={pg.loud_music_restricted} />
              <AmenityBadge label="Lock-in Period" value={pg.lock_in_period} />
              <AmenityBadge label="Agreement Mandatory" value={pg.agreement_mandatory} />
              <AmenityBadge label="ID Proof Mandatory" value={pg.id_proof_mandatory} />
              <AmenityBadge label="Office Going Only" value={pg.office_going_only} />
              <AmenityBadge label="Students Only" value={pg.students_only} />
              <AmenityBadge label="Boys Only" value={pg.boys_only} />
              <AmenityBadge label="Girls Only" value={pg.girls_only} />
              <AmenityBadge label="Co-Living Allowed" value={pg.co_living_allowed} />
              <AmenityBadge label="Subletting Allowed" value={pg.subletting_allowed} />
            </div>
          </Section>

          {/* 📝 DESCRIPTION */}
          <Section title="📝 Description">
            <EditableRow label="Description" field="description" value={pg.description} type="textarea" />
          </Section>

          {/* 🖼️ PHOTOS */}
          <Section title="📸 Property Photos">
            {photos.length === 0 ? (
              <div className="col-span-full py-10 bg-gray-50 rounded text-center text-gray-400">
                No photos uploaded for this property
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 col-span-full">
                {photos.map((img, i) => (
                  <a key={i} href={`${FILES_BASE}${img}`} target="_blank" rel="noreferrer">
                    <img
                      src={`${FILES_BASE}${img}`}
                      alt={`Property ${i + 1}`}
                      className="h-40 w-full object-cover rounded-lg border hover:opacity-90 transition-opacity cursor-zoom-in"
                    />
                  </a>
                ))}
              </div>
            )}
          </Section>

          {/* 🎥 VIDEOS */}
          {videos.length > 0 && (
            <Section title="🎥 Property Videos">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 col-span-full">
                {videos.map((video, i) => (
                  <video key={i} controls className="w-full rounded-lg border">
                    <source src={`${FILES_BASE}${video}`} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ))}
              </div>
            </Section>
          )}

          {/* 📊 SYSTEM INFO */}
          <Section title="📊 System Information">
            <SimpleRow label="Status" value={pg.status} />
            <SimpleRow label="Is Deleted" value={pg.is_deleted ? "Yes" : "No"} />
            <SimpleRow label="Created At" value={pg.created_at ? new Date(pg.created_at).toLocaleString() : "—"} />
            <SimpleRow label="Updated At" value={pg.updated_at ? new Date(pg.updated_at).toLocaleString() : "—"} />
          </Section>

          {/* Action Footer */}
          {pg.status === "pending" && !showReject && (
            <div className="flex justify-end gap-4 border-t pt-6">
              <button
                disabled={actionLoading}
                onClick={() => setShowReject(true)}
                className="px-6 py-2 rounded-lg border border-red-200 text-red-600 font-semibold hover:bg-red-50 transition-colors"
              >
                Reject
              </button>

              <button
                disabled={actionLoading}
                onClick={approve}
                className="bg-blue-600 text-white px-8 py-2 rounded-lg font-semibold hover:bg-blue-700 shadow-md disabled:opacity-50 transition-all"
              >
                {actionLoading ? "Processing..." : "Approve Listing"}
              </button>
            </div>
          )}

          {/* Rejection Form */}
          {showReject && (
            <div className="bg-red-50 p-6 rounded-xl border border-red-100 space-y-4">
              <h4 className="font-bold text-red-800">Reject Property Listing</h4>
              <textarea
                placeholder="Explain why this property is being rejected (the owner will see this)..."
                className="w-full border border-red-200 p-3 rounded-lg focus:ring-2 focus:ring-red-500 outline-none h-32"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowReject(false)}
                  className="px-4 py-2 text-gray-600 font-medium hover:underline"
                >
                  Cancel
                </button>
                <button
                  disabled={actionLoading}
                  onClick={reject}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition-all"
                >
                  {actionLoading ? "Sending..." : "Submit Rejection"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* UI helpers */
const Section = ({ title, children }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-bold text-gray-800 border-l-4 border-blue-600 pl-3">{title}</h3>
    <div className="grid md:grid-cols-2 gap-x-12 gap-y-2">{children}</div>
  </div>
);

const AmenityBadge = ({ label, value }) => {
  const isAvailable = value === true || value === 1 || value === "1";
  return (
    <div className={`flex items-center gap-2 text-sm py-1 px-2 rounded-lg ${isAvailable ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'}`}>
      <span>{isAvailable ? '✅' : '❌'}</span>
      <span>{label}</span>
    </div>
  );
};

export default AdminPGDetails;