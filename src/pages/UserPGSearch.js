import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Search, Filter, MapPin, Home, Utensils, Snowflake, Navigation, X,
  Phone, MessageCircle, Star, Wifi, Car, Shield, Users, Calendar,
  Bed, Check, Heart, Eye, Clock, Lock, Briefcase, GraduationCap,
  Bookmark, Info, Leaf, Flame, Tv, Wind, Sparkles, Dumbbell,
  Building, Key, Sofa, Sliders, TrendingUp, Plus, Minus, BarChart,
  BadgePercent, Coins, Rocket, Megaphone, Crown, Gem, FileText,
  Headphones, Train, Bus, School, Building2, ShoppingBag, TreePine,
  WashingMachine, Fan, Stethoscope, ChevronDown, ChevronRight,
  SlidersHorizontal, Zap, Award, Coffee, ArrowUpRight, Grid3x3,
  LayoutList, MapIcon, Bell, Share2
} from "lucide-react";
import api from "../api/api";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://nepxall-backend.onrender.com";
const LOCATION_AUTO_ASKED_KEY = "nepxall_location_auto_asked";

const popularAreas = [
  { name: "Koramangala", color: "#4F46E5" },
  { name: "BTM Layout", color: "#10B981" },
  { name: "Jayanagar", color: "#F59E0B" },
  { name: "Electronic City", color: "#8B5CF6" },
  { name: "HSR Layout", color: "#EC4899" },
  { name: "Whitefield", color: "#06B6D4" },
  { name: "Marathahalli", color: "#EF4444" },
  { name: "Indiranagar", color: "#F97316" },
  { name: "Bellandur", color: "#14B8A6" },
];

const quickFilters = [
  { id: "near_me", name: "Near Me", icon: <Navigation size={14} />, type: "location", color: "#F97316" },
  { id: "ac_room", name: "AC Room", icon: <Snowflake size={14} />, type: "amenity", field: "ac_available", color: "#06B6D4" },
  { id: "wifi", name: "WiFi", icon: <Wifi size={14} />, type: "amenity", field: "wifi_available", color: "#8B5CF6" },
  { id: "parking", name: "Parking", icon: <Car size={14} />, type: "amenity", field: "parking_available", color: "#F59E0B" },
  { id: "veg_food", name: "Veg Food", icon: <Leaf size={14} />, type: "food", value: "veg", color: "#10B981" },
  { id: "attached_bath", name: "Attached Bath", icon: <Sparkles size={14} />, type: "amenity", field: "attached_bathroom", color: "#EC4899" },
];

const trackEvent = (eventName, data = {}) => {
  if (window.gtag) window.gtag("event", eventName, { ...data, timestamp: new Date().toISOString() });
};

const isMobileDevice = () => window.innerWidth < 768;
const getPGCode = (id) => `PG-${String(id).padStart(5, "0")}`;

const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatPrice = (price) => {
  if (price === null || price === undefined || price === "") return "0";
  const numPrice = Number(price);
  if (isNaN(numPrice)) return "0";
  try { return numPrice.toLocaleString("en-IN"); } catch { return numPrice.toString(); }
};

const getCorrectImageUrl = (photo) => {
  if (!photo) return null;
  if (photo.startsWith("http")) return photo;
  if (photo.includes("/uploads/")) {
    const uploadsIndex = photo.indexOf("/uploads/");
    if (uploadsIndex !== -1) return `${BACKEND_URL}${photo.substring(uploadsIndex)}`;
  }
  if (photo.includes("/opt/render/")) {
    const uploadsMatch = photo.match(/\/uploads\/.*/);
    if (uploadsMatch) return `${BACKEND_URL}${uploadsMatch[0]}`;
  }
  return `${BACKEND_URL}${photo.startsWith("/") ? photo : `/${photo}`}`;
};

const getPriceRangeByType = (pg) => {
  const prices = [];
  if (pg.pg_category === "pg") {
    [pg.single_sharing, pg.double_sharing, pg.triple_sharing, pg.four_sharing, pg.single_room, pg.double_room].forEach(p => { if (p > 0) prices.push(p); });
  } else if (pg.pg_category === "coliving") {
    [pg.co_living_single_room, pg.co_living_double_room, pg.coliving_three_sharing, pg.coliving_four_sharing].forEach(p => { if (p > 0) prices.push(p); });
  } else if (pg.pg_category === "to_let") {
    [pg.price_1bhk, pg.price_2bhk, pg.price_3bhk, pg.price_4bhk].forEach(p => { if (p > 0) prices.push(p); });
  }
  if (prices.length === 0) return { min: 0, max: 0 };
  return { min: Math.min(...prices), max: Math.max(...prices) };
};

const getEffectiveRent = (pg) => pg.rent_amount || pg.single_sharing || pg.double_sharing || pg.triple_sharing || pg.four_sharing || pg.single_room || pg.double_room || pg.co_living_single_room || pg.co_living_double_room || pg.coliving_three_sharing || pg.coliving_four_sharing || pg.price_1bhk || pg.price_2bhk || pg.price_3bhk || pg.price_4bhk || 0;

const TYPE_CONFIG = {
  pg: { label: "PG", color: "#4F46E5", bg: "#EEF2FF", strip: "#4F46E5" },
  coliving: { label: "Co-Living", color: "#8B5CF6", bg: "#F5F3FF", strip: "#8B5CF6" },
  to_let: { label: "To-Let", color: "#F97316", bg: "#FFF7ED", strip: "#F97316" },
};

// ─── SKELETON LOADER ────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div style={{ borderRadius: 20, overflow: "hidden", background: "#fff", border: "1px solid #E2E8F0", position: "relative" }}>
    <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}`}</style>
    {[240, 20, 14, 12, 40].map((h, i) => (
      <div key={i} style={{
        height: h, margin: i === 0 ? 0 : "0 20px 12px",
        marginTop: i === 1 ? 20 : undefined,
        borderRadius: i === 0 ? 0 : 8,
        background: "linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)",
        backgroundSize: "800px 100%",
        animation: "shimmer 1.5s infinite"
      }} />
    ))}
    <div style={{ height: 44, margin: "8px 20px 20px", borderRadius: 10, background: "linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)", backgroundSize: "800px 100%", animation: "shimmer 1.5s infinite" }} />
  </div>
);

// ─── BUDGET FILTER ──────────────────────────────────────────────────────────
const BudgetFilter = ({ minBudget, maxBudget, onBudgetChange, onClose }) => {
  const [localMin, setLocalMin] = useState(minBudget);
  const [localMax, setLocalMax] = useState(maxBudget);

  const budgetRanges = [
    { label: "Budget", sub: "₹0 – 5k", min: 0, max: 5000 },
    { label: "Economy", sub: "₹5k – 10k", min: 5000, max: 10000 },
    { label: "Standard", sub: "₹10k – 20k", min: 10000, max: 20000 },
    { label: "Premium", sub: "₹20k – 30k", min: 20000, max: 30000 },
    { label: "Luxury", sub: "₹30k+", min: 30000, max: 100000 },
  ];

  const pct = (v) => (v / 50000) * 100;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,22,40,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000, padding: 20, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.25)", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "#F1F5F9", border: "none", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <X size={18} color="#475569" />
        </button>
        <div style={{ padding: "32px 32px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Coins size={20} color="#4F46E5" />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: 0 }}>Set Your Budget</h2>
              <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>Monthly rent range</p>
            </div>
          </div>

          <div style={{ margin: "28px 0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 4 }}>
              {budgetRanges.map((r, i) => {
                const active = localMin === r.min && localMax === r.max;
                return (
                  <button key={i} onClick={() => { setLocalMin(r.min); setLocalMax(r.max); }}
                    style={{ padding: "12px 8px", background: active ? "#EEF2FF" : "#F8FAFC", border: active ? "2px solid #4F46E5" : "2px solid transparent", borderRadius: 12, cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: active ? "#4F46E5" : "#1E293B" }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: active ? "#6366F1" : "#64748B", marginTop: 2 }}>{r.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 2 }}>MINIMUM</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#4F46E5" }}>₹{formatPrice(localMin)}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 2 }}>MAXIMUM</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#4F46E5" }}>₹{formatPrice(localMax)}</div>
              </div>
            </div>
            <div style={{ position: "relative", height: 32, paddingTop: 13 }}>
              <div style={{ position: "absolute", inset: "13px 0 0", height: 6, background: "#E2E8F0", borderRadius: 3 }} />
              <div style={{ position: "absolute", top: 13, left: `${pct(localMin)}%`, right: `${100 - pct(localMax)}%`, height: 6, background: "linear-gradient(90deg,#4F46E5,#818CF8)", borderRadius: 3 }} />
              {[
                { val: localMin, onChange: (v) => setLocalMin(Math.min(Number(v), localMax - 1000)) },
                { val: localMax, onChange: (v) => setLocalMax(Math.max(Number(v), localMin + 1000)) },
              ].map((s, i) => (
                <input key={i} type="range" min="0" max="50000" step="500" value={s.val}
                  onChange={(e) => s.onChange(e.target.value)}
                  style={{ position: "absolute", width: "100%", top: 0, height: "100%", opacity: 0, cursor: "pointer", zIndex: i + 1 }} />
              ))}
              {[localMin, localMax].map((v, i) => (
                <div key={i} style={{ position: "absolute", top: 13, left: `${pct(v)}%`, transform: "translate(-50%, -7px)", width: 20, height: 20, borderRadius: "50%", background: "#4F46E5", border: "3px solid #fff", boxShadow: "0 2px 8px rgba(79,70,229,0.4)", pointerEvents: "none" }} />
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            {[{ label: "Min Budget", val: localMin, set: setLocalMin }, { label: "Max Budget", val: localMax, set: setLocalMax }].map((f, i) => (
              <div key={i}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{f.label}</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, fontWeight: 600, color: "#64748B" }}>₹</span>
                  <input type="number" value={f.val} onChange={(e) => f.set(Number(e.target.value))}
                    style={{ width: "100%", padding: "12px 12px 12px 30px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, background: "#F8FAFC", fontWeight: 600, color: "#1E293B", boxSizing: "border-box", outline: "none" }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { setLocalMin(0); setLocalMax(50000); }}
              style={{ flex: 1, padding: 14, background: "#F1F5F9", color: "#475569", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              Reset
            </button>
            <button onClick={() => { onBudgetChange(localMin, localMax); onClose(); }}
              style={{ flex: 2, padding: 14, background: "linear-gradient(135deg,#4F46E5,#6366F1)", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Check size={16} /> Apply Budget
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── BOOKING MODAL ───────────────────────────────────────────────────────────
const BookingModal = ({ pg, onClose, onBook }) => {
  const [bookingData, setBookingData] = useState({ roomType: "" });
  const [loading, setLoading] = useState(false);

  const getRoomTypes = () => {
    const map = {
      pg: [
        ["single_sharing", "Single Sharing"], ["double_sharing", "Double Sharing"],
        ["triple_sharing", "Triple Sharing"], ["four_sharing", "Four Sharing"],
        ["single_room", "Single Room"], ["double_room", "Double Room"],
      ],
      coliving: [
        ["co_living_single_room", "Single Room"], ["co_living_double_room", "Double Room"],
        ["coliving_three_sharing", "Triple Sharing"], ["coliving_four_sharing", "Four Sharing"],
      ],
      to_let: [
        ["price_1bhk", "1 BHK"], ["price_2bhk", "2 BHK"],
        ["price_3bhk", "3 BHK"], ["price_4bhk", "4 BHK"],
      ],
    };
    return (map[pg?.pg_category] || [])
      .filter(([field]) => pg[field] && Number(pg[field]) > 0)
      .map(([field, label]) => ({ value: label, label: `${label} – ₹${formatPrice(pg[field])}/mo`, price: pg[field] }));
  };

  const roomTypes = getRoomTypes();
  const selectedType = roomTypes.find(r => r.value === bookingData.roomType);

  if (!pg) return null;
  const config = TYPE_CONFIG[pg.pg_category] || TYPE_CONFIG.pg;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,22,40,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000, padding: 20, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.25)", position: "relative" }}>
        <div style={{ height: 5, background: `linear-gradient(90deg,${config.color},${config.color}88)`, borderRadius: "24px 24px 0 0" }} />
        <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "#F1F5F9", border: "none", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <X size={18} color="#475569" />
        </button>
        <div style={{ padding: "28px 28px 24px" }}>
          <div style={{ display: "inline-flex", padding: "4px 10px", background: config.bg, borderRadius: 20, fontSize: 12, fontWeight: 600, color: config.color, marginBottom: 12 }}>
            {config.label}
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>{pg.pg_name}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#64748B", marginBottom: 24 }}>
            <MapPin size={13} /> {pg.area}{pg.city ? `, ${pg.city}` : ""}
          </div>

          {pg.min_stay_months > 0 && (
            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "10px 14px", marginBottom: 20, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#065F46" }}>
              <Clock size={14} /> Minimum stay: <strong>{pg.min_stay_months} months</strong>
            </div>
          )}

          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {pg.pg_category === "to_let" ? "Select BHK Type" : "Select Room Type"}
          </label>
          <div style={{ display: "grid", gap: 8, marginBottom: 20 }}>
            {roomTypes.map((rt) => {
              const active = bookingData.roomType === rt.value;
              return (
                <button key={rt.value} onClick={() => setBookingData({ roomType: rt.value })}
                  style={{ padding: "14px 16px", border: active ? `2px solid ${config.color}` : "2px solid #E2E8F0", borderRadius: 12, background: active ? config.bg : "#F8FAFC", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.15s" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: active ? config.color : "#1E293B" }}>{rt.value}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: active ? config.color : "#64748B" }}>₹{formatPrice(rt.price)}</span>
                </button>
              );
            })}
          </div>

          <div style={{ background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: 12, padding: "14px 16px", marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0369A1", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <Info size={14} /> What happens next?
            </div>
            <ul style={{ margin: 0, padding: "0 0 0 16px", fontSize: 12, color: "#0C4A6E", lineHeight: 1.8 }}>
              <li>Owner gets your inquiry instantly</li>
              <li>WhatsApp notification sent to owner</li>
              <li>Owner contacts you within 24 hours</li>
              <li>Zero payment required now</li>
            </ul>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: 14, background: "#F1F5F9", color: "#475569", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button
              disabled={!bookingData.roomType || loading}
              onClick={async () => { setLoading(true); try { await onBook(bookingData); } finally { setLoading(false); } }}
              style={{ flex: 2, padding: 14, background: bookingData.roomType ? `linear-gradient(135deg,${config.color},${config.color}CC)` : "#CBD5E1", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: bookingData.roomType ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {loading ? <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Sending...</> : <><MessageCircle size={16} /> Contact Owner</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── QUICK VIEW MODAL ────────────────────────────────────────────────────────
const QuickViewModal = ({ pg, onClose, onBook, onSaveFavorite }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  const photosArray = React.useMemo(() => (pg.photos || []).filter(p => p?.trim()), [pg.photos]);
  const hasMultiple = photosArray.length > 1;
  const photoUrl = photosArray[currentImage] ? getCorrectImageUrl(photosArray[currentImage]) : pg.main_photo ? getCorrectImageUrl(pg.main_photo) : "/no-image.png";
  const startingPrice = getPriceRangeByType(pg).min || getEffectiveRent(pg);
  const config = TYPE_CONFIG[pg.pg_category] || TYPE_CONFIG.pg;

  useEffect(() => {
    if (!hasMultiple) return;
    const t = setInterval(() => setCurrentImage(p => (p + 1) % photosArray.length), 2800);
    return () => clearInterval(t);
  }, [hasMultiple, photosArray.length]);

  const amenities = [
    { icon: <Wifi size={14} />, label: "WiFi", active: pg.wifi_available },
    { icon: <Snowflake size={14} />, label: "AC", active: pg.ac_available },
    { icon: <Car size={14} />, label: "Parking", active: pg.parking_available },
    { icon: <Utensils size={14} />, label: "Food", active: pg.food_available },
  ].filter(a => a.active);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,22,40,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2500, padding: 20, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.25)", position: "relative" }}>
        {/* Image */}
        <div style={{ position: "relative", height: 260 }}>
          <img src={photoUrl} alt={pg.pg_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.src = "/no-image.png"; }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)" }} />
          <div style={{ position: "absolute", top: 14, left: 14, background: config.color, color: "#fff", padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{config.label}</div>
          {pg.is_verified && (
            <div style={{ position: "absolute", top: 14, left: 80, background: "#10B981", color: "#fff", padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
              <Shield size={11} /> Verified
            </div>
          )}
          <button onClick={() => { setIsFavorite(!isFavorite); onSaveFavorite(pg.id, !isFavorite); }}
            style={{ position: "absolute", top: 14, right: 56, background: "rgba(255,255,255,0.95)", border: "none", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Heart size={16} color="#EF4444" fill={isFavorite ? "#EF4444" : "none"} />
          </button>
          <button onClick={onClose}
            style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.95)", border: "none", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={16} color="#0F172A" />
          </button>
          {hasMultiple && (
            <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>
              {photosArray.map((_, i) => (
                <div key={i} style={{ width: i === currentImage ? 18 : 6, height: 6, borderRadius: 3, background: i === currentImage ? "#fff" : "rgba(255,255,255,0.5)", transition: "all 0.3s" }} />
              ))}
            </div>
          )}
          <div style={{ position: "absolute", bottom: 14, left: 14, color: "#fff" }}>
            <div style={{ fontSize: 20, fontWeight: 800, textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>{pg.pg_name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, opacity: 0.9 }}><MapPin size={12} />{pg.area}{pg.city ? `, ${pg.city}` : ""}</div>
          </div>
        </div>

        <div style={{ padding: "20px 24px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", lineHeight: 1 }}>₹{formatPrice(startingPrice)}</div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>per month onwards</div>
            </div>
            {pg.distance && (
              <div style={{ background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: 20, padding: "6px 12px", display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#0369A1", fontWeight: 600 }}>
                <Navigation size={12} /> {pg.distance.toFixed(1)} km
              </div>
            )}
          </div>

          {pg.pg_category !== "to_let" && (
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 700, color: "#059669", display: "flex", alignItems: "center", gap: 6 }}>
                <Bed size={13} /> {pg.available_rooms || 0} Beds Left
              </div>
              {pg.pg_category !== "to_let" && pg.available_rooms < 5 && pg.available_rooms > 0 && (
                <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 700, color: "#D97706", display: "flex", alignItems: "center", gap: 4 }}>
                  🔥 Filling Fast
                </div>
              )}
            </div>
          )}

          {amenities.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              {amenities.map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 500, color: "#475569" }}>
                  {a.icon} {a.label}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <button onClick={() => window.location.href = `tel:${pg.contact_phone}`}
              style={{ padding: "12px 8px", background: "#F0FDF4", color: "#059669", border: "1px solid #BBF7D0", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Phone size={14} /> Call
            </button>
            <button onClick={() => window.open(`https://wa.me/${pg.contact_phone}?text=Hi, interested in ${pg.pg_name}`, "_blank")}
              style={{ padding: "12px 8px", background: "#F0FDF4", color: "#059669", border: "1px solid #BBF7D0", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <MessageCircle size={14} /> WhatsApp
            </button>
            <button onClick={() => { onBook(pg); onClose(); }}
              style={{ padding: "12px 8px", background: `linear-gradient(135deg,${config.color},${config.color}CC)`, color: "#fff", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Check size={14} /> Book
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── COMPARE MODAL ───────────────────────────────────────────────────────────
const CompareModal = ({ selectedPGs, allPGs, onClose }) => {
  const compareData = allPGs.filter(pg => selectedPGs.has(pg.id));
  if (!compareData.length) return null;

  const features = [
    { key: "type", label: "Category" },
    { key: "price", label: "Monthly Rent", highlight: true },
    { key: "deposit", label: "Deposit" },
    { key: "location", label: "Area" },
    { key: "distance", label: "Distance" },
    { key: "food", label: "Food" },
    { key: "wifi", label: "WiFi" },
    { key: "ac", label: "AC" },
    { key: "parking", label: "Parking" },
    { key: "attached_bathroom", label: "Attached Bath" },
    { key: "available_rooms", label: "Beds Available" },
    { key: "min_stay", label: "Min Stay" },
  ];

  const getValue = (pg, key) => {
    if (key === "type") return TYPE_CONFIG[pg.pg_category]?.label || "PG";
    if (key === "price") return `₹${formatPrice(getEffectiveRent(pg))}`;
    if (key === "deposit") return `₹${formatPrice(pg.deposit_amount || pg.security_deposit || 0)}`;
    if (key === "location") return pg.area || pg.city || "N/A";
    if (key === "distance") return pg.distance ? `${pg.distance.toFixed(1)} km` : "N/A";
    if (key === "food") return pg.food_available ? (pg.food_type === "veg" ? "Veg" : pg.food_type === "non-veg" ? "Non-Veg" : "Both") : "No";
    if (key === "wifi") return pg.wifi_available ? "✓" : "—";
    if (key === "ac") return pg.ac_available ? "✓" : "—";
    if (key === "parking") return pg.parking_available ? "✓" : "—";
    if (key === "attached_bathroom") return pg.attached_bathroom ? "✓" : "—";
    if (key === "available_rooms") return pg.available_rooms || 0;
    if (key === "min_stay") return pg.min_stay_months ? `${pg.min_stay_months}mo` : "Flexible";
    return "N/A";
  };

  const typeColors = compareData.map(pg => TYPE_CONFIG[pg.pg_category]?.color || "#4F46E5");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,22,40,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000, padding: 20, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 900, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.25)", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "#F1F5F9", border: "none", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10 }}>
          <X size={18} color="#475569" />
        </button>
        <div style={{ padding: "32px 32px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BarChart size={20} color="#4F46E5" />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: 0 }}>Compare Properties</h2>
              <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>{compareData.length} properties selected</p>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", minWidth: 120 }}>Feature</th>
                  {compareData.map((pg, i) => (
                    <th key={pg.id} style={{ padding: "0 12px 12px", minWidth: 200 }}>
                      <div style={{ borderRadius: 16, overflow: "hidden", border: `2px solid ${typeColors[i]}20` }}>
                        {(pg.photos?.[0] || pg.main_photo) && (
                          <img src={getCorrectImageUrl(pg.photos?.[0] || pg.main_photo)} alt={pg.pg_name}
                            style={{ width: "100%", height: 100, objectFit: "cover", display: "block" }}
                            onError={(e) => { e.target.src = "/no-image.png"; }} />
                        )}
                        <div style={{ padding: "10px 12px", background: `${typeColors[i]}08` }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{pg.pg_name}</div>
                          <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{pg.area}</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: typeColors[i], marginTop: 4 }}>₹{formatPrice(getEffectiveRent(pg))}</div>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((f, fi) => (
                  <tr key={f.key} style={{ background: fi % 2 === 0 ? "#FAFAFA" : "#fff" }}>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#475569", borderBottom: "1px solid #F1F5F9" }}>{f.label}</td>
                    {compareData.map((pg, i) => {
                      const val = getValue(pg, f.key);
                      const isCheck = val === "✓";
                      const isDash = val === "—";
                      return (
                        <td key={pg.id} style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid #F1F5F9" }}>
                          <span style={{
                            display: "inline-block",
                            padding: f.highlight ? "4px 12px" : "0",
                            borderRadius: f.highlight ? 20 : 0,
                            background: f.highlight ? `${typeColors[i]}15` : "transparent",
                            color: isCheck ? "#059669" : isDash ? "#CBD5E1" : f.highlight ? typeColors[i] : "#374151",
                            fontSize: isCheck || isDash ? 16 : 13,
                            fontWeight: f.highlight ? 700 : isCheck ? 700 : 400,
                          }}>
                            {val}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24, paddingTop: 16, borderTop: "1px solid #F1F5F9" }}>
            <button onClick={onClose} style={{ padding: "12px 28px", background: "linear-gradient(135deg,#4F46E5,#6366F1)", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Close Comparison
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── HERO BANNER ─────────────────────────────────────────────────────────────
const HeroBanner = ({ onSearch }) => {
  const [q, setQ] = useState("");
  const isMobile = isMobileDevice();

  return (
    <div style={{
      background: "linear-gradient(135deg, #0A1628 0%, #1E3A5F 50%, #0F2744 100%)",
      borderRadius: 28, marginBottom: 40, overflow: "hidden",
      padding: isMobile ? "44px 24px 40px" : "68px 56px 60px",
      position: "relative"
    }}>
      {/* Decorative orbs */}
      <div style={{ position: "absolute", top: -60, right: -60, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,70,229,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -40, left: "30%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ position: "relative" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(79,70,229,0.25)", border: "1px solid rgba(99,102,241,0.4)", borderRadius: 30, padding: "6px 14px", marginBottom: 20 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#A5B4FC", letterSpacing: "0.08em", textTransform: "uppercase" }}>Bangalore's #1 PG Platform</span>
        </div>

        <h1 style={{ fontSize: isMobile ? 32 : 54, fontWeight: 900, color: "#fff", marginBottom: 12, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
          Find Your Perfect<br />
          <span style={{ background: "linear-gradient(90deg,#818CF8,#A5F3FC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>PG, Coliving</span>{" "}
          <span style={{ color: "#E2E8F0" }}>& Rentals</span>
        </h1>
        <p style={{ fontSize: isMobile ? 15 : 18, color: "rgba(226,232,240,0.8)", marginBottom: 32, maxWidth: 520, lineHeight: 1.6 }}>
          Verified listings · Zero brokerage · Direct owner contact. Move in faster.
        </p>

        <form onSubmit={(e) => { e.preventDefault(); onSearch(q.trim()); }}
          style={{ display: "flex", maxWidth: 580, background: "rgba(255,255,255,0.97)", borderRadius: 60, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", paddingLeft: 20 }}>
            <MapPin size={18} color="#4F46E5" />
          </div>
          <input type="text" placeholder="Search by area, city, or PG name..." value={q} onChange={(e) => setQ(e.target.value)}
            style={{ flex: 1, padding: "16px 16px", border: "none", outline: "none", fontSize: 15, background: "transparent", color: "#0F172A" }} />
          <button type="submit" style={{ padding: "14px 28px", background: "linear-gradient(135deg,#4F46E5,#6366F1)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
            <Search size={18} /> Search
          </button>
        </form>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 24 }}>
          {["✓ Verified Owners", "✓ No Brokerage", "✓ Instant Contact", "✓ 500+ Listings"].map((tag) => (
            <div key={tag} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)", padding: "6px 14px", borderRadius: 30, fontSize: 12, fontWeight: 500 }}>{tag}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── WHY NEPXALL ─────────────────────────────────────────────────────────────
const WhyChooseNepxall = () => {
  const isMobile = isMobileDevice();
  const tenantBenefits = [
    { icon: <MapPin size={20} />, title: "Near Your Workplace", color: "#4F46E5" },
    { icon: <Shield size={20} />, title: "Verified Listings", color: "#10B981" },
    { icon: <BarChart size={20} />, title: "Compare Properties", color: "#8B5CF6" },
    { icon: <Phone size={20} />, title: "Direct Owner Contact", color: "#F59E0B" },
    { icon: <Coins size={20} />, title: "Zero Broker Fees", color: "#EF4444" },
  ];
  const ownerBenefits = [
    { icon: <Users size={20} />, title: "More Tenant Leads", color: "#4F46E5" },
    { icon: <Plus size={20} />, title: "Free Listing", color: "#10B981" },
    { icon: <Calendar size={20} />, title: "Booking Management", color: "#8B5CF6" },
    { icon: <Award size={20} />, title: "Trust Badge System", color: "#F59E0B" },
    { icon: <Rocket size={20} />, title: "Fill Rooms Faster", color: "#EF4444" },
  ];

  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: 30, padding: "5px 14px", marginBottom: 12 }}>
          <Sparkles size={13} color="#0284C7" />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#0284C7", textTransform: "uppercase", letterSpacing: "0.08em" }}>Why Nepxall</span>
        </div>
        <h2 style={{ fontSize: isMobile ? 26 : 34, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", margin: "0 0 8px" }}>Built for Bangalore Renters</h2>
        <p style={{ fontSize: 15, color: "#64748B", margin: 0 }}>Trusted by thousands of tenants and PG owners</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
        {[
          { title: "For Tenants", icon: <Users size={20} color="#4F46E5" />, gradient: "linear-gradient(135deg,#EEF2FF,#F0F9FF)", border: "#C7D2FE", items: tenantBenefits },
          { title: "For PG Owners", icon: <Building size={20} color="#10B981" />, gradient: "linear-gradient(135deg,#F0FDF4,#ECFDF5)", border: "#A7F3D0", items: ownerBenefits },
        ].map((section, si) => (
          <div key={si} style={{ background: section.gradient, borderRadius: 20, padding: 24, border: `1px solid ${section.border}` }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              {section.icon} {section.title}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {section.items.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.85)", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.9)" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: `${item.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: item.color }}>{item.icon}</div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1E293B", lineHeight: 1.3 }}>{item.title}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── PROPERTY CARD ────────────────────────────────────────────────────────────
const PGPropertyCard = ({ pg, onQuickView, onFavorite, onContact, onCardClick, isFavorite, isSelectedForCompare, onSelectForCompare, compareMode }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [hovered, setHovered] = useState(false);
  const photosArray = React.useMemo(() => (pg.photos || []).filter(p => p?.trim()), [pg.photos]);
  const hasMultiple = photosArray.length > 1;
  const photoUrl = photosArray[currentImage] ? getCorrectImageUrl(photosArray[currentImage]) : pg.main_photo ? getCorrectImageUrl(pg.main_photo) : "/no-image.png";
  const startingPrice = getPriceRangeByType(pg).min || getEffectiveRent(pg);
  const priceRange = getPriceRangeByType(pg);
  const config = TYPE_CONFIG[pg.pg_category] || TYPE_CONFIG.pg;
  const isFillingFast = pg.available_rooms < 5 && pg.available_rooms > 0;

  useEffect(() => {
    if (!hasMultiple || compareMode || !hovered) return;
    const t = setInterval(() => setCurrentImage(p => (p + 1) % photosArray.length), 1800);
    return () => clearInterval(t);
  }, [hasMultiple, photosArray.length, compareMode, hovered]);

  const pgTypeLabel = pg.pg_type ? pg.pg_type.charAt(0).toUpperCase() + pg.pg_type.slice(1) + " PG" : "PG";

  const amenityBadges = [
    pg.wifi_available && { icon: <Wifi size={11} />, label: "WiFi" },
    pg.ac_available && { icon: <Snowflake size={11} />, label: "AC" },
    pg.parking_available && { icon: <Car size={11} />, label: "Parking" },
    pg.food_available && { icon: <Utensils size={11} />, label: "Food" },
  ].filter(Boolean).slice(0, 3);

  return (
    <div
      onClick={() => onCardClick(pg)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 20, overflow: "hidden", background: "#fff", cursor: "pointer",
        border: isSelectedForCompare ? `2px solid ${config.color}` : "1px solid #E2E8F0",
        boxShadow: hovered ? "0 16px 48px rgba(15,23,42,0.12)" : "0 2px 12px rgba(15,23,42,0.06)",
        transform: hovered ? "translateY(-4px)" : "none",
        transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
        position: "relative",
        display: "flex", flexDirection: "column"
      }}
    >
      {/* Type accent strip */}
      <div style={{ height: 4, background: `linear-gradient(90deg,${config.color},${config.color}66)` }} />

      {/* Image area */}
      <div style={{ position: "relative", height: 220, overflow: "hidden" }}>
        <img src={photoUrl} alt={pg.pg_name}
          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease", transform: hovered ? "scale(1.03)" : "scale(1)" }}
          onError={(e) => { e.target.src = "/no-image.png"; }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(15,23,42,0.55) 100%)" }} />

        {/* Top controls */}
        <div style={{ position: "absolute", top: 12, left: 12, right: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {compareMode && (
              <button onClick={(e) => onSelectForCompare(pg.id, e)}
                style={{ background: isSelectedForCompare ? config.color : "rgba(255,255,255,0.95)", border: "none", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
                {isSelectedForCompare ? <Check size={15} color="#fff" /> : <Plus size={15} color="#475569" />}
              </button>
            )}
            <button onClick={(e) => onFavorite(pg.id, e)}
              style={{ background: "rgba(255,255,255,0.95)", border: "none", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
              <Heart size={15} color="#EF4444" fill={isFavorite ? "#EF4444" : "none"} />
            </button>
          </div>
          <button onClick={(e) => onQuickView(pg, e)}
            style={{ background: "rgba(255,255,255,0.95)", border: "none", padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
            <Eye size={12} /> Quick View
          </button>
        </div>

        {/* Bottom image info */}
        <div style={{ position: "absolute", bottom: 12, left: 12, right: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ background: config.color, color: "#fff", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
              {pg.pg_category === "to_let" ? "To-Let" : pg.pg_category === "coliving" ? "Co-Living" : pgTypeLabel}
            </div>
            {pg.is_verified && (
              <div style={{ background: "#10B981", color: "#fff", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                <Shield size={10} /> Verified
              </div>
            )}
          </div>
          {pg.distance && (
            <div style={{ background: "rgba(0,0,0,0.65)", color: "#fff", padding: "4px 10px", borderRadius: 20, fontSize: 11, display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
              <Navigation size={10} /> {pg.distance.toFixed(1)} km
            </div>
          )}
        </div>

        {/* Image dots */}
        {hasMultiple && (
          <div style={{ position: "absolute", bottom: 44, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 4 }}>
            {photosArray.map((_, i) => (
              <div key={i} style={{ width: i === currentImage ? 14 : 5, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.9)", transition: "all 0.3s" }} />
            ))}
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: "16px 18px 18px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: "0 0 4px", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pg.pg_name}</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#64748B" }}>
            <MapPin size={12} color="#94A3B8" />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pg.area}{pg.city ? `, ${pg.city}` : ""}</span>
          </div>
        </div>

        {/* Price row */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>₹{formatPrice(startingPrice)}</span>
            <span style={{ fontSize: 12, color: "#94A3B8", marginLeft: 4 }}>
              {pg.pg_category === "to_let" ? "/mo" : "onwards/mo"}
            </span>
          </div>
          {priceRange.max > priceRange.min && priceRange.max > 0 && (
            <span style={{ fontSize: 12, color: "#64748B" }}>up to ₹{formatPrice(priceRange.max)}</span>
          )}
        </div>

        {/* Badges */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {pg.pg_category !== "to_let" && (
            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: "#059669", display: "flex", alignItems: "center", gap: 4 }}>
              <Bed size={11} /> {pg.available_rooms || 0} beds
            </div>
          )}
          {isFillingFast && (
            <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: "#D97706" }}>
              🔥 Filling Fast
            </div>
          )}
          {pg.pg_category === "to_let" && pg.bhk_type && (
            <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: "#C2410C" }}>
              🏠 {pg.bhk_type}
            </div>
          )}
          {pg.pg_category === "to_let" && pg.ready_to_move && (
            <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: "#1D4ED8" }}>
              ✓ Ready
            </div>
          )}
          {pg.pg_category === "to_let" && pg.furnishing_type && (
            <div style={{ background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: "#6D28D9" }}>
              🛋️ {pg.furnishing_type}
            </div>
          )}
          {pg.food_available && pg.food_type === "veg" && (
            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: "#059669" }}>
              🌿 Veg Food
            </div>
          )}
        </div>

        {/* Amenity icons */}
        {amenityBadges.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {amenityBadges.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 16, padding: "4px 10px", fontSize: 11, color: "#475569", fontWeight: 500 }}>
                {a.icon} {a.label}
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div style={{ marginTop: "auto" }}>
          <button onClick={(e) => { e.stopPropagation(); onContact(pg); }}
            style={{ width: "100%", padding: "12px", background: `linear-gradient(135deg,${config.color},${config.color}CC)`, color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "opacity 0.2s" }}
            onMouseEnter={(e) => e.target.style.opacity = "0.9"}
            onMouseLeave={(e) => e.target.style.opacity = "1"}>
            <MessageCircle size={15} /> Contact Owner
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
function UserPGSearch() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [allPGs, setAllPGs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 12;

  const [activeTab, setActiveTab] = useState("all");
  const propertyTabs = [
    { id: "all", label: "All Properties", short: "All" },
    { id: "pg", label: "PG", short: "PG" },
    { id: "coliving", label: "Co-Living", short: "Co-Living" },
    { id: "to_let", label: "To-Let", short: "To-Let" },
  ];

  const [userLocation, setUserLocation] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showBudgetFilter, setShowBudgetFilter] = useState(false);
  const [quickViewPG, setQuickViewPG] = useState(null);
  const [bookingPG, setBookingPG] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [notification, setNotification] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState(new Set());
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [activeQuickFilters, setActiveQuickFilters] = useState(new Set());

  const [filters, setFilters] = useState({
    location: "", minBudget: 0, maxBudget: 50000, food: false, ac: false,
    wifi: false, parking: false, sort: "", nearMe: false, foodType: "", attached_bathroom: false,
  });

  useEffect(() => {
    const autoAsked = localStorage.getItem(LOCATION_AUTO_ASKED_KEY);
    if (!autoAsked && !userLocation && !locationLoading) autoDetectLocation();
  }, []);

  const autoDetectLocation = () => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserLocation(loc);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}&zoom=18&addressdetails=1`);
        const d = await res.json();
        if (d.address) setUserAddress(d.address.suburb || d.address.neighbourhood || d.address.city_district || "");
      } catch {}
      setFilters(p => ({ ...p, nearMe: true, sort: "distance" }));
      localStorage.setItem(LOCATION_AUTO_ASKED_KEY, "true");
      setLocationLoading(false);
    }, () => { localStorage.setItem(LOCATION_AUTO_ASKED_KEY, "true"); setLocationLoading(false); },
      { enableHighAccuracy: true, timeout: 10000 });
  };

  const processPGData = (data) => data.map(pg => ({
    ...pg,
    deposit_amount: Number(pg.deposit_amount) || Number(pg.security_deposit) || 0,
    rent_amount: Number(pg.rent_amount) || 0,
    single_sharing: Number(pg.single_sharing) || 0, double_sharing: Number(pg.double_sharing) || 0,
    triple_sharing: Number(pg.triple_sharing) || 0, four_sharing: Number(pg.four_sharing) || 0,
    single_room: Number(pg.single_room) || 0, double_room: Number(pg.double_room) || 0,
    price_1bhk: Number(pg.price_1bhk) || 0, price_2bhk: Number(pg.price_2bhk) || 0,
    price_3bhk: Number(pg.price_3bhk) || 0, price_4bhk: Number(pg.price_4bhk) || 0,
    co_living_single_room: Number(pg.co_living_single_room) || 0, co_living_double_room: Number(pg.co_living_double_room) || 0,
    coliving_three_sharing: Number(pg.coliving_three_sharing) || 0, coliving_four_sharing: Number(pg.coliving_four_sharing) || 0,
    security_deposit: Number(pg.security_deposit) || 0, available_rooms: Number(pg.available_rooms) || 0,
    total_rooms: Number(pg.total_rooms) || 0, min_stay_months: Number(pg.min_stay_months) || 0,
    ready_to_move: pg.ready_to_move === true || pg.ready_to_move === 1 || pg.ready_to_move === "true",
    family_allowed: pg.family_allowed === true || pg.family_allowed === 1 || pg.family_allowed === "true",
    food_available: pg.food_available === true || pg.food_available === 1 || pg.food_available === "true",
    ac_available: pg.ac_available === true || pg.ac_available === 1 || pg.ac_available === "true",
    wifi_available: pg.wifi_available === true || pg.wifi_available === 1 || pg.wifi_available === "true",
    parking_available: pg.parking_available === true || pg.parking_available === 1 || pg.parking_available === "true",
    is_verified: pg.is_verified === true || pg.is_verified === 1 || pg.is_verified === "true",
    attached_bathroom: pg.attached_bathroom === true || pg.attached_bathroom === 1 || pg.attached_bathroom === "true",
  }));

  const loadPGs = async (pageToLoad = 1, isLoadMore = false) => {
    try {
      isLoadMore ? setLoadingMore(true) : setLoading(true);
      let sortParam = "relevance";
      if (filters.sort === "low") sortParam = "price_low";
      else if (filters.sort === "high") sortParam = "price_high";
      else if (filters.sort === "new") sortParam = "newest";
      else if (filters.sort === "distance" && userLocation) sortParam = "nearest";
      let url = `/pg/search/advanced?page=${pageToLoad}&limit=${PAGE_SIZE}&sort_by=${sortParam}`;
      if (filters.location) url += `&search=${encodeURIComponent(filters.location)}`;
      if (userLocation && filters.nearMe) url += `&lat=${userLocation.lat}&lng=${userLocation.lng}`;
      const response = await api.get(url);
      if (response.data?.data) {
        let rawData = response.data.data;
        if (userLocation) rawData = rawData.map(pg => pg.latitude && pg.longitude ? { ...pg, distance: getDistanceKm(userLocation.lat, userLocation.lng, pg.latitude, pg.longitude) } : pg);
        const processed = processPGData(rawData);
        if (!isLoadMore || pageToLoad === 1) setAllPGs(processed);
        else setAllPGs(p => [...p, ...processed]);
        setHasMorePages(response.data.hasMore === true);
        setTotalCount(response.data.total || 0);
        setCurrentPage(pageToLoad);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); setLoadingMore(false); }
  };

  const resetAndFetch = () => { setCurrentPage(1); loadPGs(1, false); };
  const loadMoreProperties = () => { if (!loadingMore && hasMorePages && !loading) loadPGs(currentPage + 1, true); };

  useEffect(() => { resetAndFetch(); loadFavorites(); }, []);
  useEffect(() => { resetAndFetch(); }, [filters.location, filters.sort, filters.nearMe, userLocation, filters.minBudget, filters.maxBudget, filters.food, filters.ac, filters.wifi, filters.parking, filters.foodType, filters.attached_bathroom]);

  const loadFavorites = () => { try { const s = localStorage.getItem("pg_favorites"); if (s) setFavorites(new Set(JSON.parse(s))); } catch {} };
  const saveFavorites = (f) => { try { localStorage.setItem("pg_favorites", JSON.stringify([...f])); } catch {} };

  const toggleFavorite = (pgId, e) => {
    e.stopPropagation();
    const nf = new Set(favorites);
    nf.has(pgId) ? (nf.delete(pgId), showNotification("Removed from saved")) : (nf.add(pgId), showNotification("✓ Saved to favourites"));
    setFavorites(nf); saveFavorites(nf);
  };

  const showNotification = (message, isError = false) => {
    setNotification({ message, isError });
    setTimeout(() => setNotification(null), 3000);
  };

  const applyQuickFilter = (filter) => {
    const nf = new Set(activeQuickFilters);
    const removing = nf.has(filter.id);
    removing ? nf.delete(filter.id) : nf.add(filter.id);
    if (filter.type === "location") setFilters(p => ({ ...p, nearMe: !removing, sort: !removing ? "distance" : p.sort }));
    else if (filter.type === "food") setFilters(p => ({ ...p, foodType: removing ? "" : filter.value }));
    else if (filter.type === "amenity") setFilters(p => ({ ...p, [filter.field]: !removing }));
    setActiveQuickFilters(nf);
    if (!removing && filter.type === "location") detectLocation();
    resetAndFetch();
  };

  const filterByArea = (area) => {
    setFilters(p => ({ ...p, location: area === p.location ? "" : area, nearMe: false }));
  };

  const detectLocation = () => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserLocation(loc);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}&zoom=18&addressdetails=1`);
        const d = await res.json();
        if (d.address) setUserAddress(d.address.suburb || d.address.neighbourhood || "");
      } catch {}
      setFilters(p => ({ ...p, nearMe: true, sort: "distance" }));
      setLocationLoading(false); resetAndFetch();
    }, () => { showNotification("Unable to get location", true); setLocationLoading(false); });
  };

  const applyFilters = useCallback(() => {
    let filtered = [...allPGs];
    if (filters.location) filtered = filtered.filter(pg => `${pg.area||""} ${pg.city||""} ${pg.pg_name||""}`.toLowerCase().includes(filters.location.toLowerCase()));
    filtered = filtered.filter(pg => { const r = getEffectiveRent(pg); return r >= filters.minBudget && r <= filters.maxBudget; });
    if (filters.food) filtered = filtered.filter(pg => pg.food_available);
    if (filters.ac) filtered = filtered.filter(pg => pg.ac_available);
    if (filters.wifi) filtered = filtered.filter(pg => pg.wifi_available);
    if (filters.parking) filtered = filtered.filter(pg => pg.parking_available);
    if (filters.attached_bathroom) filtered = filtered.filter(pg => pg.attached_bathroom);
    if (filters.foodType) filtered = filtered.filter(pg => pg.food_type === filters.foodType);
    if (filters.sort === "low") filtered.sort((a, b) => getEffectiveRent(a) - getEffectiveRent(b));
    else if (filters.sort === "high") filtered.sort((a, b) => getEffectiveRent(b) - getEffectiveRent(a));
    else if (filters.sort === "new") filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else if (filters.sort === "distance" && userLocation) filtered.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    return filtered;
  }, [allPGs, filters, userLocation]);

  // FIXED: Changed from useCallback with immediate invocation to useMemo
  const filteredPGs = useMemo(() => {
    const f = applyFilters();
    return activeTab === "all" ? f : f.filter(pg => pg.pg_category === activeTab);
  }, [applyFilters, activeTab]);

  const handleBudgetChange = (min, max) => {
    setFilters(p => ({ ...p, minBudget: min, maxBudget: max }));
    showNotification(`Budget: ₹${formatPrice(min)} – ₹${formatPrice(max)}`);
  };

  const resetFilters = () => {
    setFilters({ location: "", minBudget: 0, maxBudget: 50000, food: false, ac: false, wifi: false, parking: false, sort: "", nearMe: false, foodType: "", attached_bathroom: false });
    setActiveQuickFilters(new Set());
    showNotification("Filters cleared");
    resetAndFetch();
  };

  const handleBookNow = (pg) => {
    if (!user) { showNotification("Please login to contact owner"); navigate("/login"); return; }
    setBookingPG(pg);
  };

  const handleBookingSubmit = async (bookingData) => {
    try {
      if (!user) { navigate("/register"); return; }
      const token = await user.getIdToken(true);
      const res = await api.post(`/bookings/${bookingPG.id}`, { room_type: bookingData.roomType }, { headers: { Authorization: `Bearer ${token}` } });
      showNotification(res.data.message || "✅ Owner will contact you soon");
      if (bookingPG.contact_phone) setTimeout(() => window.location.href = `tel:${bookingPG.contact_phone}`, 600);
      setBookingPG(null);
    } catch (error) {
      if (error.response?.data?.message?.includes("already")) {
        showNotification("📞 Connecting you to owner...");
        if (bookingPG.contact_phone) setTimeout(() => window.location.href = `tel:${bookingPG.contact_phone}`, 600);
        setBookingPG(null);
      } else showNotification(error.response?.data?.message || "Something went wrong", true);
    }
  };

  const toggleSelectForCompare = (pgId, e) => {
    e.stopPropagation();
    const ns = new Set(selectedForCompare);
    if (ns.has(pgId)) ns.delete(pgId);
    else if (ns.size < 3) ns.add(pgId);
    else { showNotification("Max 3 properties at once"); return; }
    setSelectedForCompare(ns);
  };

  const hasActiveFilters = filters.location || filters.minBudget > 0 || filters.maxBudget < 50000 || filters.food || filters.ac || filters.wifi || filters.parking || filters.foodType || filters.attached_bathroom || activeQuickFilters.size > 0;

  if (authLoading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 16 }}>
      <div style={{ width: 44, height: 44, border: "3px solid #E2E8F0", borderTop: "3px solid #4F46E5", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <span style={{ color: "#64748B", fontSize: 15 }}>Loading…</span>
    </div>
  );

  return (
    <div style={{ maxWidth: 1440, margin: "auto", minHeight: "100vh", padding: "0 20px", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>

      <style>{`
        @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideRight { from{transform:translateX(120%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        * { box-sizing: border-box; }
        input:focus, select:focus { outline: 2px solid #4F46E5; outline-offset: 1px; }
        ::-webkit-scrollbar { height: 5px; width: 6px; }
        ::-webkit-scrollbar-track { background: #F1F5F9; border-radius: 10px; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
      `}</style>

      {/* ── TOAST NOTIFICATION ── */}
      {notification && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 5000,
          background: notification.isError ? "#EF4444" : "#0F172A",
          color: "#fff", padding: "14px 20px", borderRadius: 14,
          display: "flex", alignItems: "center", gap: 10,
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          animation: "slideRight 0.3s ease", fontSize: 14, fontWeight: 600, maxWidth: 360
        }}>
          {notification.isError ? <X size={16} /> : <Check size={16} color="#10B981" />}
          {notification.message}
        </div>
      )}

      {/* ── HERO ── */}
      <div style={{ paddingTop: 28 }}>
        <HeroBanner onSearch={(q) => setFilters(p => ({ ...p, location: q }))} />
      </div>

      {/* ── WHY NEPXALL ── */}
      <WhyChooseNepxall />

      {/* ── LOCATION BAR ── */}
      {userLocation && (
        <div style={{ background: "linear-gradient(135deg,#EFF6FF,#EEF2FF)", border: "1px solid #C7D2FE", borderRadius: 16, padding: "14px 20px", marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, animation: "fadeIn 0.4s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "#EEF2FF", border: "1px solid #C7D2FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Navigation size={18} color="#4F46E5" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#312E81" }}>
                📍 {userAddress ? `Near ${userAddress}` : "Your Location"} · Properties within 5km
              </div>
              <div style={{ fontSize: 12, color: "#6366F1", marginTop: 1 }}>Sorted by distance</div>
            </div>
          </div>
          <button onClick={detectLocation} disabled={locationLoading}
            style={{ padding: "8px 16px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            {locationLoading ? <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> : <Navigation size={13} />}
            Refresh
          </button>
        </div>
      )}

      {/* ── QUICK FILTERS ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {quickFilters.map((filter) => {
            const active = activeQuickFilters.has(filter.id);
            return (
              <button key={filter.id} onClick={() => applyQuickFilter(filter)}
                style={{ padding: "9px 16px", borderRadius: 30, background: active ? filter.color : "#F8FAFC", color: active ? "#fff" : "#475569", border: active ? `1px solid ${filter.color}` : "1px solid #E2E8F0", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s", boxShadow: active ? `0 2px 8px ${filter.color}40` : "none" }}>
                {filter.icon} {filter.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── POPULAR AREAS ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Popular Areas · Bangalore</div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
          {popularAreas.map((area) => {
            const active = filters.location === area.name;
            return (
              <button key={area.name} onClick={() => filterByArea(area.name)}
                style={{ padding: "8px 18px", borderRadius: 30, border: active ? `2px solid ${area.color}` : "1.5px solid #E2E8F0", background: active ? `${area.color}12` : "#fff", color: active ? area.color : "#475569", whiteSpace: "nowrap", cursor: "pointer", fontWeight: active ? 700 : 500, fontSize: 13, transition: "all 0.2s", flexShrink: 0 }}>
                {area.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div style={{ background: "#fff", borderRadius: 20, padding: "18px 20px", boxShadow: "0 4px 24px rgba(15,23,42,0.07)", marginBottom: 32, position: "sticky", top: 16, zIndex: 100, border: "1px solid #E2E8F0" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 240, position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", pointerEvents: "none" }} />
            <input placeholder="Search by area, city or PG name…" value={filters.location}
              onChange={(e) => setFilters(p => ({ ...p, location: e.target.value }))}
              style={{ width: "100%", padding: "11px 14px 11px 40px", border: "1.5px solid #E2E8F0", borderRadius: 30, fontSize: 14, background: "#F8FAFC", color: "#0F172A" }} />
          </div>

          {[
            { label: "Budget", icon: <Coins size={15} />, onClick: () => setShowBudgetFilter(true), active: filters.minBudget > 0 || filters.maxBudget < 50000, color: "#4F46E5" },
            { label: "Filters", icon: <SlidersHorizontal size={15} />, onClick: () => setShowFilters(p => !p), active: showFilters, color: "#4F46E5" },
            { label: locationLoading ? "Locating…" : "Near Me", icon: <Navigation size={15} />, onClick: detectLocation, active: filters.nearMe, color: "#F97316" },
            { label: compareMode ? `Compare (${selectedForCompare.size})` : "Compare", icon: <BarChart size={15} />, onClick: () => { setCompareMode(p => !p); if (compareMode) setSelectedForCompare(new Set()); }, active: compareMode, color: "#8B5CF6" },
          ].map((btn, i) => (
            <button key={i} onClick={btn.onClick}
              style={{ padding: "11px 18px", background: btn.active ? btn.color : "#F8FAFC", color: btn.active ? "#fff" : "#475569", border: btn.active ? "none" : "1.5px solid #E2E8F0", borderRadius: 30, display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", transition: "all 0.2s", boxShadow: btn.active ? `0 2px 8px ${btn.color}40` : "none" }}>
              {btn.icon} {btn.label}
            </button>
          ))}

          {hasActiveFilters && (
            <button onClick={resetFilters}
              style={{ padding: "11px 16px", background: "#FEF2F2", color: "#EF4444", border: "1.5px solid #FECACA", borderRadius: 30, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
              <X size={14} /> Clear All
            </button>
          )}

          {compareMode && selectedForCompare.size >= 2 && (
            <button onClick={() => setShowCompareModal(true)}
              style={{ padding: "11px 20px", background: "linear-gradient(135deg,#8B5CF6,#7C3AED)", color: "#fff", border: "none", borderRadius: 30, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <BarChart size={14} /> Compare Now
            </button>
          )}
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div style={{ paddingTop: 18, marginTop: 18, borderTop: "1px solid #F1F5F9", animation: "fadeIn 0.25s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Food Type</label>
                <select value={filters.foodType} onChange={(e) => setFilters(p => ({ ...p, foodType: e.target.value }))}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, background: "#F8FAFC", fontSize: 13, color: "#374151" }}>
                  <option value="">Any</option>
                  <option value="veg">Vegetarian</option>
                  <option value="non-veg">Non-Vegetarian</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Sort By</label>
                <select value={filters.sort} onChange={(e) => setFilters(p => ({ ...p, sort: e.target.value }))}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, background: "#F8FAFC", fontSize: 13, color: "#374151" }}>
                  <option value="">Relevance</option>
                  <option value="low">Price: Low → High</option>
                  <option value="high">Price: High → Low</option>
                  <option value="new">Newest First</option>
                  {userLocation && <option value="distance">Nearest First</option>}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Amenities</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { key: "food", label: "Food", icon: <Utensils size={13} />, color: "#10B981" },
                    { key: "ac", label: "AC", icon: <Snowflake size={13} />, color: "#06B6D4" },
                    { key: "wifi", label: "WiFi", icon: <Wifi size={13} />, color: "#8B5CF6" },
                    { key: "parking", label: "Park", icon: <Car size={13} />, color: "#F59E0B" },
                  ].map(({ key, label, icon, color }) => (
                    <button key={key} onClick={() => setFilters(p => ({ ...p, [key]: !p[key] }))}
                      style={{ padding: "7px 12px", border: filters[key] ? "none" : "1.5px solid #E2E8F0", background: filters[key] ? color : "#F8FAFC", color: filters[key] ? "#fff" : "#475569", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5, transition: "all 0.2s" }}>
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── PROPERTY TYPE TABS ── */}
      <div style={{ display: "flex", gap: 6, marginBottom: 28, overflowX: "auto", paddingBottom: 4 }}>
        {propertyTabs.map((tab) => {
          const active = activeTab === tab.id;
          const cfg = tab.id !== "all" ? TYPE_CONFIG[tab.id] : null;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ padding: "11px 22px", borderRadius: 30, background: active ? (cfg?.color || "#0F172A") : "#F8FAFC", color: active ? "#fff" : "#475569", border: active ? "none" : "1.5px solid #E2E8F0", cursor: "pointer", fontSize: 14, fontWeight: active ? 700 : 500, transition: "all 0.2s", whiteSpace: "nowrap", flexShrink: 0, boxShadow: active ? `0 2px 10px ${cfg?.color || "#0F172A"}40` : "none" }}>
              {tab.short}
            </button>
          );
        })}
      </div>

      {/* ── RESULTS HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "0 0 3px", letterSpacing: "-0.01em" }}>
            {activeTab === "all" ? "All Properties" : propertyTabs.find(t => t.id === activeTab)?.label}
          </h2>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
            {loading ? "Loading…" : `${filteredPGs.length} ${filteredPGs.length === 1 ? "property" : "properties"} found`}
            {totalCount > 0 && !loading && ` · ${totalCount} total`}
          </p>
        </div>
        {hasActiveFilters && !loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "#4F46E5" }}>
            <Filter size={13} /> Filters active
          </div>
        )}
      </div>

      {/* ── GRID ── */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 24 }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredPGs.length > 0 ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 24, animation: "fadeIn 0.4s ease" }}>
            {filteredPGs.map((pg) => (
              <PGPropertyCard key={pg.id} pg={pg}
                onQuickView={(p, e) => { e.stopPropagation(); setQuickViewPG(p); }}
                onFavorite={toggleFavorite}
                onContact={handleBookNow}
                onCardClick={(p) => navigate(`/pg/${p.id}`)}
                isFavorite={favorites.has(pg.id)}
                isSelectedForCompare={selectedForCompare.has(pg.id)}
                onSelectForCompare={toggleSelectForCompare}
                compareMode={compareMode}
              />
            ))}
          </div>

          {/* Load More */}
          {hasMorePages && !loadingMore && filteredPGs.length < totalCount && (
            <div style={{ textAlign: "center", marginTop: 48, marginBottom: 60 }}>
              <button onClick={loadMoreProperties}
                style={{ padding: "14px 40px", background: "linear-gradient(135deg,#4F46E5,#6366F1)", color: "#fff", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(79,70,229,0.3)", transition: "all 0.2s", display: "inline-flex", alignItems: "center", gap: 10 }}>
                Load More Properties <ChevronDown size={16} />
              </button>
              <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 10 }}>
                Showing {filteredPGs.length} of {totalCount}
              </div>
            </div>
          )}

          {loadingMore && (
            <div style={{ textAlign: "center", marginTop: 32, marginBottom: 48 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 30, padding: "12px 24px" }}>
                <div style={{ width: 18, height: 18, border: "2px solid #E2E8F0", borderTop: "2px solid #4F46E5", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <span style={{ fontSize: 14, color: "#475569", fontWeight: 600 }}>Loading more properties…</span>
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "80px 20px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 24, marginBottom: 48, animation: "fadeIn 0.4s ease" }}>
          <div style={{ width: 64, height: 64, background: "#EEF2FF", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Search size={28} color="#4F46E5" />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1E293B", marginBottom: 8 }}>No properties found</h3>
          <p style={{ color: "#64748B", marginBottom: 28, fontSize: 15 }}>Try a different area or adjust your filters</p>
          <button onClick={resetFilters}
            style={{ padding: "12px 32px", background: "linear-gradient(135deg,#4F46E5,#6366F1)", color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 15 }}>
            Reset Filters
          </button>
        </div>
      )}

      {/* ── MODALS ── */}
      {showBudgetFilter && <BudgetFilter minBudget={filters.minBudget} maxBudget={filters.maxBudget} onBudgetChange={handleBudgetChange} onClose={() => setShowBudgetFilter(false)} />}
      {quickViewPG && <QuickViewModal pg={quickViewPG} onClose={() => setQuickViewPG(null)} onBook={handleBookNow} onSaveFavorite={(id, fav) => { const nf = new Set(favorites); fav ? nf.add(id) : nf.delete(id); setFavorites(nf); saveFavorites(nf); }} />}
      {bookingPG && <BookingModal pg={bookingPG} onClose={() => setBookingPG(null)} onBook={handleBookingSubmit} />}
      {showCompareModal && <CompareModal selectedPGs={selectedForCompare} allPGs={allPGs} onClose={() => { setShowCompareModal(false); setSelectedForCompare(new Set()); setCompareMode(false); }} />}

      {/* Mobile sticky CTA */}
      {isMobileDevice() && !compareMode && filteredPGs.length > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 16px 20px", background: "linear-gradient(to top, #fff 70%, transparent)", zIndex: 900 }}>
          <button onClick={() => handleBookNow(filteredPGs[0])}
            style={{ width: "100%", padding: "15px", background: "linear-gradient(135deg,#4F46E5,#6366F1)", color: "#fff", border: "none", borderRadius: 16, fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 4px 24px rgba(79,70,229,0.35)" }}>
            <MessageCircle size={20} /> Contact Owner
          </button>
        </div>
      )}
    </div>
  );
}

export default UserPGSearch;