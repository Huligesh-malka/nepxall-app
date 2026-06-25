import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Search, MapPin, Utensils, Snowflake, Navigation, X,
  Phone, MessageCircle, Wifi, Car, Shield,
  Bed, Check, Heart, Eye, Clock, Info,
  Plus, BarChart, Coins,
  ChevronDown, SlidersHorizontal, Filter
} from "lucide-react";
import api from "../api/api";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://nepxall-backend.onrender.com";
const LOCATION_AUTO_ASKED_KEY = "nepxall_location_auto_asked";

const popularAreas = [
  { name: "Koramangala", color: "#4F46E5" },
  { name: "BTM Layout", color: "#10B981" },
  { name: "HSR Layout", color: "#EC4899" },
  { name: "Electronic City", color: "#8B5CF6" },
  { name: "Whitefield", color: "#06B6D4" },
  { name: "Marathahalli", color: "#EF4444" },
  { name: "Indiranagar", color: "#F97316" },
  { name: "Jayanagar", color: "#F59E0B" },
];

const TYPE_CONFIG = {
  pg:       { label: "PG",        color: "#4F46E5", bg: "#EEF2FF" },
  coliving: { label: "Co-Living", color: "#8B5CF6", bg: "#F5F3FF" },
  to_let:   { label: "To-Let",    color: "#F97316", bg: "#FFF7ED" },
};

/* ─── HELPERS ─── */
const isMobile = () => window.innerWidth < 768;

const fmt = (price) => {
  if (!price && price !== 0) return "0";
  const n = Number(price);
  if (isNaN(n)) return "0";
  try { return n.toLocaleString("en-IN"); } catch { return String(n); }
};

const imgUrl = (photo) => {
  if (!photo) return null;
  if (photo.startsWith("http")) return photo;
  if (photo.includes("/uploads/")) return `${BACKEND_URL}${photo.substring(photo.indexOf("/uploads/"))}`;
  return `${BACKEND_URL}${photo.startsWith("/") ? photo : `/${photo}`}`;
};

const distKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371, r = (v) => (v * Math.PI) / 180;
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lon2 - lon1) / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const priceRange = (pg) => {
  const prices = [];
  if (pg.pg_category === "pg")
    [pg.single_sharing, pg.double_sharing, pg.triple_sharing, pg.four_sharing, pg.single_room, pg.double_room].forEach(p => p > 0 && prices.push(p));
  else if (pg.pg_category === "coliving")
    [pg.co_living_single_room, pg.co_living_double_room, pg.coliving_three_sharing, pg.coliving_four_sharing].forEach(p => p > 0 && prices.push(p));
  else if (pg.pg_category === "to_let")
    [pg.price_1bhk, pg.price_2bhk, pg.price_3bhk, pg.price_4bhk].forEach(p => p > 0 && prices.push(p));
  if (!prices.length) return { min: 0, max: 0 };
  return { min: Math.min(...prices), max: Math.max(...prices) };
};

const effRent = (pg) =>
  pg.rent_amount || pg.single_sharing || pg.double_sharing || pg.triple_sharing ||
  pg.four_sharing || pg.single_room || pg.double_room || pg.co_living_single_room ||
  pg.co_living_double_room || pg.coliving_three_sharing || pg.coliving_four_sharing ||
  pg.price_1bhk || pg.price_2bhk || pg.price_3bhk || pg.price_4bhk || 0;

const bool = (v) => v === true || v === 1 || v === "true";

/* ─── SKELETON ─── */
const Skeleton = () => (
  <div style={{ borderRadius: 20, overflow: "hidden", background: "#fff", border: "1px solid #E2E8F0" }}>
    <style>{`@keyframes sh{0%{background-position:-600px 0}100%{background-position:600px 0}}`}</style>
    {[220, 18, 14, 44].map((h, i) => (
      <div key={i} style={{
        height: h, margin: i === 0 ? 0 : i === 3 ? "8px 16px 16px" : "0 16px 10px",
        marginTop: i === 1 ? 16 : undefined, borderRadius: i === 0 ? 0 : 8,
        background: "linear-gradient(90deg,#F1F5F9 25%,#E8EDF2 50%,#F1F5F9 75%)",
        backgroundSize: "1200px 100%", animation: "sh 1.4s infinite"
      }} />
    ))}
  </div>
);

/* ─── BUDGET MODAL ─── */
const BudgetModal = ({ min, max, onChange, onClose }) => {
  const [lMin, setLMin] = useState(min);
  const [lMax, setLMax] = useState(max);
  const pct = (v) => Math.min(100, (v / 50000) * 100);
  const presets = [
    { label: "Under ₹5k", min: 0, max: 5000 },
    { label: "₹5k–10k",   min: 5000, max: 10000 },
    { label: "₹10k–20k",  min: 10000, max: 20000 },
    { label: "₹20k–30k",  min: 20000, max: 30000 },
    { label: "₹30k+",     min: 30000, max: 100000 },
  ];
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(10,22,40,0.65)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:3000, padding:20, backdropFilter:"blur(4px)" }}>
      <div style={{ background:"#fff", borderRadius:24, width:"100%", maxWidth:460, boxShadow:"0 24px 64px rgba(0,0,0,0.2)", position:"relative" }}>
        <button onClick={onClose} style={{ position:"absolute", top:16, right:16, background:"#F1F5F9", border:"none", width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}><X size={16} color="#475569" /></button>
        <div style={{ padding:"28px 28px 24px" }}>
          <h3 style={{ fontSize:18, fontWeight:700, color:"#0F172A", margin:"0 0 4px" }}>Set Budget</h3>
          <p style={{ fontSize:13, color:"#64748B", margin:"0 0 20px" }}>Monthly rent range</p>

          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
            <div style={{ textAlign:"center", background:"#F8FAFC", border:"1.5px solid #E2E8F0", borderRadius:12, padding:"10px 20px" }}>
              <div style={{ fontSize:11, color:"#94A3B8", fontWeight:600, textTransform:"uppercase" }}>Min</div>
              <div style={{ fontSize:20, fontWeight:800, color:"#4F46E5" }}>₹{fmt(lMin)}</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", color:"#CBD5E1", fontSize:18 }}>—</div>
            <div style={{ textAlign:"center", background:"#F8FAFC", border:"1.5px solid #E2E8F0", borderRadius:12, padding:"10px 20px" }}>
              <div style={{ fontSize:11, color:"#94A3B8", fontWeight:600, textTransform:"uppercase" }}>Max</div>
              <div style={{ fontSize:20, fontWeight:800, color:"#4F46E5" }}>₹{fmt(lMax)}</div>
            </div>
          </div>

          <div style={{ position:"relative", height:28, marginBottom:20 }}>
            <div style={{ position:"absolute", top:"50%", left:0, right:0, height:4, background:"#E2E8F0", borderRadius:2, transform:"translateY(-50%)" }} />
            <div style={{ position:"absolute", top:"50%", left:`${pct(lMin)}%`, right:`${100 - pct(lMax)}%`, height:4, background:"linear-gradient(90deg,#4F46E5,#818CF8)", borderRadius:2, transform:"translateY(-50%)" }} />
            <input type="range" min={0} max={50000} step={500} value={lMin} onChange={e => setLMin(Math.min(Number(e.target.value), lMax - 500))}
              style={{ position:"absolute", width:"100%", top:0, bottom:0, opacity:0, cursor:"pointer", zIndex:2 }} />
            <input type="range" min={0} max={50000} step={500} value={lMax} onChange={e => setLMax(Math.max(Number(e.target.value), lMin + 500))}
              style={{ position:"absolute", width:"100%", top:0, bottom:0, opacity:0, cursor:"pointer", zIndex:3 }} />
            {[lMin, lMax].map((v, i) => (
              <div key={i} style={{ position:"absolute", top:"50%", left:`${pct(v)}%`, transform:"translate(-50%,-50%)", width:18, height:18, borderRadius:"50%", background:"#4F46E5", border:"3px solid #fff", boxShadow:"0 2px 8px rgba(79,70,229,0.4)", pointerEvents:"none" }} />
            ))}
          </div>

          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:20 }}>
            {presets.map((p, i) => {
              const active = lMin === p.min && lMax === p.max;
              return (
                <button key={i} onClick={() => { setLMin(p.min); setLMax(p.max); }}
                  style={{ padding:"6px 14px", borderRadius:20, background: active ? "#4F46E5" : "#F8FAFC", color: active ? "#fff" : "#475569", border: active ? "none" : "1px solid #E2E8F0", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                  {p.label}
                </button>
              );
            })}
          </div>

          <div style={{ display:"flex", gap:10 }}>
            <button onClick={() => { setLMin(0); setLMax(50000); }} style={{ flex:1, padding:13, background:"#F1F5F9", color:"#475569", border:"none", borderRadius:12, fontSize:14, fontWeight:600, cursor:"pointer" }}>Reset</button>
            <button onClick={() => { onChange(lMin, lMax); onClose(); }} style={{ flex:2, padding:13, background:"linear-gradient(135deg,#4F46E5,#6366F1)", color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              <Check size={15} /> Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── CONTACT MODAL ─── */
const ContactModal = ({ pg, onClose, onSubmit }) => {
  const [roomType, setRoomType] = useState("");
  const [loading, setLoading] = useState(false);
  const config = TYPE_CONFIG[pg?.pg_category] || TYPE_CONFIG.pg;

  const roomOptions = React.useMemo(() => {
    if (!pg) return [];
    const map = {
      pg: [["single_sharing","Single Sharing"],["double_sharing","Double Sharing"],["triple_sharing","Triple Sharing"],["four_sharing","Four Sharing"],["single_room","Single Room"],["double_room","Double Room"]],
      coliving: [["co_living_single_room","Single Room"],["co_living_double_room","Double Room"],["coliving_three_sharing","Triple Sharing"],["coliving_four_sharing","Four Sharing"]],
      to_let: [["price_1bhk","1 BHK"],["price_2bhk","2 BHK"],["price_3bhk","3 BHK"],["price_4bhk","4 BHK"]],
    };
    return (map[pg.pg_category] || []).filter(([f]) => pg[f] > 0).map(([f, label]) => ({ value: label, price: pg[f] }));
  }, [pg]);

  // Generate detailed WhatsApp message
  const generateWhatsAppMessage = useCallback(() => {
    if (!pg) return "";
    
    const roomTypeText = roomType || "Flexible";
    const priceText = roomType 
      ? roomOptions.find(opt => opt.value === roomType)?.price 
      : priceRange(pg).min || effRent(pg);
    
    const amenities = [];
    if (pg.wifi_available) amenities.push("✅ WiFi");
    if (pg.ac_available) amenities.push("✅ AC");
    if (pg.parking_available) amenities.push("✅ Parking");
    if (pg.food_available) amenities.push(`✅ Food (${pg.food_type || 'Available'})`);
    
    const message = `Hi 👋,

I found your property "${pg.pg_name}" on Nepxall.

I'm looking for accommodation and I'm interested in your property.

Could you please let me know:
🏠 Is this property currently available?
💰 Current rent: ₹${fmt(priceText)}/month
🛏 Room sharing options: ${roomTypeText}
${amenities.length > 0 ? `🔧 Amenities: ${amenities.join(', ')}` : ''}
📍 Exact location: ${pg.area}${pg.city ? `, ${pg.city}` : ''}
${pg.min_stay_months > 0 ? `📅 Minimum stay: ${pg.min_stay_months} months` : ''}
📅 Earliest move-in date: 

Thank you!`;
    
    return message;
  }, [pg, roomType, roomOptions]);

  if (!pg) return null;
  
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(10,22,40,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:3000, padding:20, backdropFilter:"blur(4px)" }}>
      <div style={{ background:"#fff", borderRadius:24, width:"100%", maxWidth:440, boxShadow:"0 24px 64px rgba(0,0,0,0.2)", position:"relative", overflow:"hidden" }}>
        <div style={{ height:4, background:`linear-gradient(90deg,${config.color},${config.color}88)` }} />
        <button onClick={onClose} style={{ position:"absolute", top:16, right:16, background:"#F1F5F9", border:"none", width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}><X size={16} color="#475569" /></button>
        <div style={{ padding:"24px 24px 20px" }}>
          <div style={{ display:"inline-flex", padding:"3px 10px", background:config.bg, borderRadius:20, fontSize:11, fontWeight:700, color:config.color, marginBottom:10 }}>{config.label}</div>
          <h3 style={{ fontSize:18, fontWeight:700, color:"#0F172A", margin:"0 0 4px" }}>{pg.pg_name}</h3>
          <div style={{ fontSize:13, color:"#64748B", marginBottom:20, display:"flex", alignItems:"center", gap:4 }}><MapPin size={12} />{pg.area}{pg.city ? `, ${pg.city}` : ""}</div>

          {pg.min_stay_months > 0 && (
            <div style={{ background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:10, padding:"8px 12px", marginBottom:16, fontSize:12, color:"#065F46", display:"flex", alignItems:"center", gap:6 }}>
              <Clock size={13} /> Min stay: <strong>{pg.min_stay_months} months</strong>
            </div>
          )}

          <div style={{ display:"grid", gap:8, marginBottom:16 }}>
            {roomOptions.map((rt) => {
              const active = roomType === rt.value;
              return (
                <button key={rt.value} onClick={() => setRoomType(rt.value)}
                  style={{ padding:"12px 16px", border: active ? `2px solid ${config.color}` : "2px solid #E2E8F0", borderRadius:12, background: active ? config.bg : "#F8FAFC", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", transition:"all 0.15s" }}>
                  <span style={{ fontSize:14, fontWeight:600, color: active ? config.color : "#1E293B" }}>{rt.value}</span>
                  <span style={{ fontSize:15, fontWeight:700, color: active ? config.color : "#64748B" }}>₹{fmt(rt.price)}/mo</span>
                </button>
              );
            })}
          </div>

          <div style={{ background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:10, padding:"10px 14px", marginBottom:20 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#0369A1", marginBottom:6, display:"flex", alignItems:"center", gap:5 }}><Info size={13} /> What happens next?</div>
            <ul style={{ margin:0, padding:"0 0 0 14px", fontSize:12, color:"#0C4A6E", lineHeight:1.9 }}>
              <li>Owner gets your inquiry instantly</li>
              <li>Owner contacts you within 24 hours</li>
              <li>No payment required now</li>
            </ul>
          </div>

          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => window.location.href = `tel:${pg.contact_phone}`}
              style={{ flex:1, padding:13, background:"#F0FDF4", color:"#059669", border:"1px solid #BBF7D0", borderRadius:12, fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <Phone size={14} /> Call
            </button>
            <button 
              onClick={() => {
                const message = generateWhatsAppMessage();
                window.open(`https://wa.me/${pg.contact_phone}?text=${encodeURIComponent(message)}`, "_blank");
              }}
              style={{ flex:1, padding:13, background:"#F0FDF4", color:"#059669", border:"1px solid #BBF7D0", borderRadius:12, fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <MessageCircle size={14} /> WhatsApp
            </button>
            <button
              disabled={!roomType || loading}
              onClick={async () => { setLoading(true); try { await onSubmit({ roomType }); } finally { setLoading(false); } }}
              style={{ flex:2, padding:13, background: roomType ? `linear-gradient(135deg,${config.color},${config.color}CC)` : "#CBD5E1", color:"#fff", border:"none", borderRadius:12, fontSize:13, fontWeight:700, cursor: roomType ? "pointer" : "not-allowed", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              {loading ? <div style={{ width:14, height:14, border:"2px solid rgba(255,255,255,0.4)", borderTop:"2px solid #fff", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} /> : <><Check size={14} /> Book Now</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── QUICK VIEW MODAL ─── */
const QuickView = ({ pg, onClose, onContact, onFav, isFav }) => {
  const [img, setImg] = useState(0);
  const photos = React.useMemo(() => (pg.photos || []).filter(p => p?.trim()), [pg.photos]);
  const config = TYPE_CONFIG[pg.pg_category] || TYPE_CONFIG.pg;
  const price = priceRange(pg).min || effRent(pg);

  useEffect(() => {
    if (photos.length < 2) return;
    const t = setInterval(() => setImg(i => (i + 1) % photos.length), 2500);
    return () => clearInterval(t);
  }, [photos.length]);

  const amenities = [
    pg.wifi_available && { icon: <Wifi size={13} />, label: "WiFi" },
    pg.ac_available   && { icon: <Snowflake size={13} />, label: "AC" },
    pg.parking_available && { icon: <Car size={13} />, label: "Parking" },
    pg.food_available && { icon: <Utensils size={13} />, label: "Food" },
  ].filter(Boolean);

  const photoSrc = photos[img] ? imgUrl(photos[img]) : pg.main_photo ? imgUrl(pg.main_photo) : "/no-image.png";

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(10,22,40,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2500, padding:20, backdropFilter:"blur(4px)" }}>
      <div style={{ background:"#fff", borderRadius:24, width:"100%", maxWidth:460, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,0.2)", position:"relative" }}>
        <div style={{ position:"relative", height:240 }}>
          <img src={photoSrc} alt={pg.pg_name} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e => { e.target.src = "/no-image.png"; }} />
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)" }} />
          <div style={{ position:"absolute", top:12, left:12, background:config.color, color:"#fff", padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>{config.label}</div>
          {pg.is_verified && <div style={{ position:"absolute", top:12, left:72, background:"#10B981", color:"#fff", padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:700, display:"flex", alignItems:"center", gap:3 }}><Shield size={10} /> Verified</div>}
          <button onClick={() => { onFav(pg.id, !isFav); }} style={{ position:"absolute", top:12, right:48, background:"rgba(255,255,255,0.92)", border:"none", width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <Heart size={15} color="#EF4444" fill={isFav ? "#EF4444" : "none"} />
          </button>
          <button onClick={onClose} style={{ position:"absolute", top:12, right:12, background:"rgba(255,255,255,0.92)", border:"none", width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}><X size={15} color="#0F172A" /></button>
          {photos.length > 1 && (
            <div style={{ position:"absolute", bottom:12, left:"50%", transform:"translateX(-50%)", display:"flex", gap:4 }}>
              {photos.map((_, i) => <div key={i} style={{ width: i===img?16:5, height:5, borderRadius:3, background:"rgba(255,255,255,0.9)", transition:"all 0.3s" }} />)}
            </div>
          )}
          <div style={{ position:"absolute", bottom:14, left:14 }}>
            <div style={{ fontSize:18, fontWeight:800, color:"#fff", textShadow:"0 2px 8px rgba(0,0,0,0.4)" }}>{pg.pg_name}</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.85)", display:"flex", alignItems:"center", gap:3 }}><MapPin size={11} />{pg.area}{pg.city ? `, ${pg.city}` : ""}</div>
          </div>
        </div>

        <div style={{ padding:"18px 20px 20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
            <div>
              <div style={{ fontSize:26, fontWeight:800, color:"#0F172A", lineHeight:1 }}>₹{fmt(price)}</div>
              <div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>per month onwards</div>
            </div>
            {pg.distance && (
              <div style={{ background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:20, padding:"5px 12px", fontSize:12, color:"#0369A1", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                <Navigation size={11} /> {pg.distance.toFixed(1)} km
              </div>
            )}
          </div>

          {pg.pg_category !== "to_let" && (
            <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
              <div style={{ background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:20, padding:"5px 12px", fontSize:12, fontWeight:700, color:"#059669", display:"flex", alignItems:"center", gap:5 }}>
                <Bed size={12} /> {pg.available_rooms || 0} Beds Left
              </div>
              {pg.available_rooms > 0 && pg.available_rooms < 5 && (
                <div style={{ background:"#FEF3C7", border:"1px solid #FDE68A", borderRadius:20, padding:"5px 12px", fontSize:12, fontWeight:700, color:"#D97706" }}>🔥 Filling Fast</div>
              )}
            </div>
          )}

          {amenities.length > 0 && (
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
              {amenities.map((a, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:4, background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:20, padding:"4px 10px", fontSize:11, color:"#475569", fontWeight:500 }}>
                  {a.icon} {a.label}
                </div>
              ))}
            </div>
          )}

          <button onClick={() => { onContact(pg); onClose(); }}
            style={{ width:"100%", padding:"13px", background:`linear-gradient(135deg,${config.color},${config.color}CC)`, color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            <MessageCircle size={15} /> Contact Owner
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── COMPARE MODAL ─── */
const CompareModal = ({ ids, allPGs, onClose }) => {
  const data = allPGs.filter(pg => ids.has(pg.id));
  if (!data.length) return null;
  const colors = data.map(pg => TYPE_CONFIG[pg.pg_category]?.color || "#4F46E5");
  const rows = [
    { label:"Type",        get: pg => TYPE_CONFIG[pg.pg_category]?.label || "PG" },
    { label:"Monthly Rent",get: pg => `₹${fmt(effRent(pg))}`, hi:true },
    { label:"Deposit",     get: pg => `₹${fmt(pg.deposit_amount || pg.security_deposit || 0)}` },
    { label:"Area",        get: pg => pg.area || pg.city || "N/A" },
    { label:"Distance",    get: pg => pg.distance ? `${pg.distance.toFixed(1)} km` : "N/A" },
    { label:"Food",        get: pg => pg.food_available ? (pg.food_type === "veg" ? "Veg" : pg.food_type === "non-veg" ? "Non-Veg" : "Both") : "No" },
    { label:"WiFi",        get: pg => pg.wifi_available ? "✓" : "—" },
    { label:"AC",          get: pg => pg.ac_available ? "✓" : "—" },
    { label:"Parking",     get: pg => pg.parking_available ? "✓" : "—" },
    { label:"Beds Left",   get: pg => pg.available_rooms || 0 },
    { label:"Min Stay",    get: pg => pg.min_stay_months ? `${pg.min_stay_months}mo` : "Flexible" },
  ];
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(10,22,40,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:3000, padding:20, backdropFilter:"blur(4px)" }}>
      <div style={{ background:"#fff", borderRadius:24, width:"100%", maxWidth:860, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,0.2)", position:"relative" }}>
        <button onClick={onClose} style={{ position:"absolute", top:16, right:16, background:"#F1F5F9", border:"none", width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", zIndex:10 }}><X size={16} color="#475569" /></button>
        <div style={{ padding:"28px 28px 24px" }}>
          <h3 style={{ fontSize:20, fontWeight:700, color:"#0F172A", margin:"0 0 4px" }}>Compare Properties</h3>
          <p style={{ fontSize:13, color:"#64748B", margin:"0 0 24px" }}>{data.length} properties side by side</p>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  <th style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", minWidth:110 }}>Feature</th>
                  {data.map((pg, i) => (
                    <th key={pg.id} style={{ padding:"0 10px 12px", minWidth:180 }}>
                      <div style={{ borderRadius:14, overflow:"hidden", border:`2px solid ${colors[i]}20` }}>
                        {(pg.photos?.[0] || pg.main_photo) && <img src={imgUrl(pg.photos?.[0] || pg.main_photo)} alt={pg.pg_name} style={{ width:"100%", height:90, objectFit:"cover" }} onError={e => { e.target.src="/no-image.png"; }} />}
                        <div style={{ padding:"8px 10px", background:`${colors[i]}08` }}>
                          <div style={{ fontSize:12, fontWeight:700, color:"#0F172A" }}>{pg.pg_name}</div>
                          <div style={{ fontSize:16, fontWeight:800, color:colors[i], marginTop:2 }}>₹{fmt(effRent(pg))}</div>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} style={{ background: ri % 2 === 0 ? "#FAFAFA" : "#fff" }}>
                    <td style={{ padding:"11px 14px", fontSize:13, fontWeight:600, color:"#475569", borderBottom:"1px solid #F1F5F9" }}>{row.label}</td>
                    {data.map((pg, i) => {
                      const v = row.get(pg);
                      return (
                        <td key={pg.id} style={{ padding:"11px 10px", textAlign:"center", borderBottom:"1px solid #F1F5F9" }}>
                          <span style={{ display:"inline-block", padding: row.hi ? "3px 10px" : "0", borderRadius: row.hi ? 20 : 0, background: row.hi ? `${colors[i]}15` : "transparent", color: v==="✓" ? "#059669" : v==="—" ? "#CBD5E1" : row.hi ? colors[i] : "#374151", fontWeight: row.hi || v==="✓" ? 700 : 400, fontSize: v==="✓"||v==="—" ? 15 : 13 }}>{v}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end", marginTop:20, paddingTop:16, borderTop:"1px solid #F1F5F9" }}>
            <button onClick={onClose} style={{ padding:"11px 24px", background:"linear-gradient(135deg,#4F46E5,#6366F1)", color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer" }}>Done</button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── PROPERTY CARD ─── */
const Card = ({ pg, onQuickView, onFav, onContact, onClick, isFav, forCompare, onSelectCompare, compareMode }) => {
  const [imgIdx, setImgIdx] = useState(0);
  const [hovered, setHovered] = useState(false);
  const photos = React.useMemo(() => (pg.photos || []).filter(p => p?.trim()), [pg.photos]);
  const config = TYPE_CONFIG[pg.pg_category] || TYPE_CONFIG.pg;
  const startPrice = priceRange(pg).min || effRent(pg);
  const maxPrice   = priceRange(pg).max;
  const filling    = pg.available_rooms > 0 && pg.available_rooms < 5;
  const photoSrc   = photos[imgIdx] ? imgUrl(photos[imgIdx]) : pg.main_photo ? imgUrl(pg.main_photo) : "/no-image.png";
  const pgLabel    = pg.pg_category === "to_let" ? "To-Let" : pg.pg_category === "coliving" ? "Co-Living" : pg.pg_type ? pg.pg_type.charAt(0).toUpperCase() + pg.pg_type.slice(1) + " PG" : "PG";

  useEffect(() => {
    if (photos.length < 2 || !hovered || compareMode) return;
    const t = setInterval(() => setImgIdx(i => (i + 1) % photos.length), 1800);
    return () => clearInterval(t);
  }, [photos.length, hovered, compareMode]);

  const badges = [
    pg.wifi_available    && { icon:<Wifi size={11}/>,      label:"WiFi" },
    pg.ac_available      && { icon:<Snowflake size={11}/>, label:"AC" },
    pg.parking_available && { icon:<Car size={11}/>,       label:"Parking" },
  ].filter(Boolean);

  return (
    <div onClick={() => onClick(pg)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ borderRadius:20, overflow:"hidden", background:"#fff", cursor:"pointer", display:"flex", flexDirection:"column",
        border: forCompare ? `2px solid ${config.color}` : "1px solid #E2E8F0",
        boxShadow: hovered ? "0 16px 48px rgba(15,23,42,0.12)" : "0 2px 12px rgba(15,23,42,0.06)",
        transform: hovered ? "translateY(-4px)" : "none",
        transition:"all 0.25s cubic-bezier(0.4,0,0.2,1)" }}>

      {/* colour strip */}
      <div style={{ height:4, background:`linear-gradient(90deg,${config.color},${config.color}55)` }} />

      {/* image */}
      <div style={{ position:"relative", height:210, overflow:"hidden" }}>
        <img src={photoSrc} alt={pg.pg_name}
          style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform 0.5s ease", transform: hovered ? "scale(1.04)" : "scale(1)" }}
          onError={e => { e.target.src="/no-image.png"; }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,transparent 40%,rgba(15,23,42,0.5) 100%)" }} />

        {/* top-left controls */}
        <div style={{ position:"absolute", top:10, left:10, display:"flex", gap:5 }}>
          {compareMode && (
            <button onClick={e => onSelectCompare(pg.id, e)}
              style={{ background: forCompare ? config.color : "rgba(255,255,255,0.94)", border:"none", width:30, height:30, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", boxShadow:"0 2px 6px rgba(0,0,0,0.12)" }}>
              {forCompare ? <Check size={14} color="#fff" /> : <Plus size={14} color="#475569" />}
            </button>
          )}
          <button onClick={e => { e.stopPropagation(); onFav(pg.id, e); }}
            style={{ background:"rgba(255,255,255,0.94)", border:"none", width:30, height:30, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", boxShadow:"0 2px 6px rgba(0,0,0,0.12)" }}>
            <Heart size={14} color="#EF4444" fill={isFav ? "#EF4444" : "none"} />
          </button>
        </div>

        {/* quick view top-right */}
        <button onClick={e => onQuickView(pg, e)}
          style={{ position:"absolute", top:10, right:10, background:"rgba(255,255,255,0.94)", border:"none", padding:"5px 11px", borderRadius:20, fontSize:11, fontWeight:600, color:"#374151", cursor:"pointer", display:"flex", alignItems:"center", gap:4, boxShadow:"0 2px 6px rgba(0,0,0,0.12)" }}>
          <Eye size={11} /> Quick View
        </button>

        {/* bottom badges */}
        <div style={{ position:"absolute", bottom:10, left:10, right:10, display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            <div style={{ background:config.color, color:"#fff", padding:"3px 9px", borderRadius:20, fontSize:10, fontWeight:700 }}>{pgLabel}</div>
            {pg.is_verified && <div style={{ background:"#10B981", color:"#fff", padding:"3px 9px", borderRadius:20, fontSize:10, fontWeight:700, display:"flex", alignItems:"center", gap:2 }}><Shield size={9}/> Verified</div>}
          </div>
          {pg.distance && <div style={{ background:"rgba(0,0,0,0.6)", color:"#fff", padding:"3px 9px", borderRadius:20, fontSize:10, fontWeight:600, display:"flex", alignItems:"center", gap:3 }}><Navigation size={9}/>{pg.distance.toFixed(1)}km</div>}
        </div>

        {/* image dots */}
        {photos.length > 1 && (
          <div style={{ position:"absolute", bottom:38, left:"50%", transform:"translateX(-50%)", display:"flex", gap:3 }}>
            {photos.map((_, i) => <div key={i} style={{ width: i===imgIdx?12:4, height:4, borderRadius:2, background:"rgba(255,255,255,0.85)", transition:"all 0.3s" }} />)}
          </div>
        )}
      </div>

      {/* card body */}
      <div style={{ padding:"14px 16px 16px", flex:1, display:"flex", flexDirection:"column" }}>
        <h3 style={{ fontSize:15, fontWeight:700, color:"#0F172A", margin:"0 0 3px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{pg.pg_name}</h3>
        <div style={{ fontSize:12, color:"#64748B", marginBottom:10, display:"flex", alignItems:"center", gap:3 }}>
          <MapPin size={11} color="#94A3B8" />
          <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{pg.area}{pg.city ? `, ${pg.city}` : ""}</span>
        </div>

        {/* price */}
        <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:10 }}>
          <div>
            <span style={{ fontSize:20, fontWeight:800, color:"#0F172A" }}>₹{fmt(startPrice)}</span>
            <span style={{ fontSize:11, color:"#94A3B8", marginLeft:3 }}>{pg.pg_category==="to_let" ? "/mo" : "onwards/mo"}</span>
          </div>
          {maxPrice > startPrice && <span style={{ fontSize:11, color:"#64748B" }}>up to ₹{fmt(maxPrice)}</span>}
        </div>

        {/* badges row */}
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:10 }}>
          {pg.pg_category !== "to_let" && (
            <div style={{ background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:20, padding:"3px 9px", fontSize:10, fontWeight:700, color:"#059669", display:"flex", alignItems:"center", gap:3 }}>
              <Bed size={10}/> {pg.available_rooms||0} beds
            </div>
          )}
          {filling && <div style={{ background:"#FEF3C7", border:"1px solid #FDE68A", borderRadius:20, padding:"3px 9px", fontSize:10, fontWeight:700, color:"#D97706" }}>🔥 Filling Fast</div>}
          {pg.pg_category==="to_let" && pg.bhk_type && <div style={{ background:"#FFF7ED", border:"1px solid #FED7AA", borderRadius:20, padding:"3px 9px", fontSize:10, fontWeight:700, color:"#C2410C" }}>🏠 {pg.bhk_type}</div>}
          {pg.pg_category==="to_let" && pg.furnishing_type && <div style={{ background:"#F5F3FF", border:"1px solid #DDD6FE", borderRadius:20, padding:"3px 9px", fontSize:10, fontWeight:700, color:"#6D28D9" }}>🛋️ {pg.furnishing_type}</div>}
          {pg.food_available && pg.food_type==="veg" && <div style={{ background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:20, padding:"3px 9px", fontSize:10, fontWeight:700, color:"#059669" }}>🌿 Veg</div>}
          {pg.pg_category==="to_let" && pg.ready_to_move && <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:20, padding:"3px 9px", fontSize:10, fontWeight:700, color:"#1D4ED8" }}>✓ Ready</div>}
        </div>

        {/* amenities */}
        {badges.length > 0 && (
          <div style={{ display:"flex", gap:5, marginBottom:12 }}>
            {badges.map((b, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:3, background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:16, padding:"3px 8px", fontSize:10, color:"#475569", fontWeight:500 }}>
                {b.icon} {b.label}
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <button onClick={e => { e.stopPropagation(); onContact(pg); }}
          style={{ marginTop:"auto", width:"100%", padding:"11px", background:`linear-gradient(135deg,${config.color},${config.color}CC)`, color:"#fff", border:"none", borderRadius:11, fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
          <MessageCircle size={14}/> Contact Owner
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
function UserPGSearch() {
  const navigate   = useNavigate();
  const { user, loading: authLoading } = useAuth();

  /* data */
  const [allPGs,       setAllPGs]       = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [page,         setPage]         = useState(1);
  const [hasMore,      setHasMore]      = useState(true);
  const [total,        setTotal]        = useState(0);
  const PAGE = 12;

  /* ui state */
  const [tab,          setTab]          = useState("all");
  const [quickView,    setQuickView]    = useState(null);
  const [contactPG,    setContactPG]    = useState(null);
  const [favorites,    setFavorites]    = useState(new Set());
  const [toast,        setToast]        = useState(null);
  const [showBudget,   setShowBudget]   = useState(false);
  const [showFilters,  setShowFilters]  = useState(false);
  const [compareMode,  setCompareMode]  = useState(false);
  const [compareSet,   setCompareSet]   = useState(new Set());
  const [showCompare,  setShowCompare]  = useState(false);

  /* location */
  const [userLoc,      setUserLoc]      = useState(null);
  const [userArea,     setUserArea]     = useState("");
  const [locLoading,   setLocLoading]   = useState(false);

  /* filters */
  const [search,  setSearch]  = useState("");
  const [minB,    setMinB]    = useState(0);
  const [maxB,    setMaxB]    = useState(50000);
  const [nearMe,  setNearMe]  = useState(false);
  const [sort,    setSort]    = useState("");
  const [amenity, setAmenity] = useState({ food:false, ac:false, wifi:false, parking:false });
  const [foodType,setFoodType]= useState("");

  /* ─ toast ─ */
  const notify = (msg, err=false) => {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 3000);
  };

  /* ─ location ─ */
  const detectLoc = useCallback(() => {
    if (!navigator.geolocation) { notify("Geolocation not supported", true); return; }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(async pos => {
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserLoc(loc);
      setNearMe(true);
      setSort("distance");
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}&zoom=18&addressdetails=1`);
        const d = await r.json();
        setUserArea(d.address?.suburb || d.address?.neighbourhood || d.address?.city_district || "");
      } catch {}
      setLocLoading(false);
    }, () => { notify("Could not get location", true); setLocLoading(false); }, { enableHighAccuracy:true, timeout:10000 });
  }, []);

  useEffect(() => {
    const asked = localStorage.getItem(LOCATION_AUTO_ASKED_KEY);
    if (!asked) { autoLoc(); }
  }, []);

  const autoLoc = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async pos => {
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserLoc(loc); setNearMe(true); setSort("distance");
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}&zoom=18&addressdetails=1`);
        const d = await r.json();
        setUserArea(d.address?.suburb || d.address?.neighbourhood || "");
      } catch {}
      localStorage.setItem(LOCATION_AUTO_ASKED_KEY, "true");
    }, () => localStorage.setItem(LOCATION_AUTO_ASKED_KEY, "true"), { timeout:8000 });
  };

  /* ─ process data ─ */
  const process = (data) => data.map(pg => ({
    ...pg,
    single_sharing: Number(pg.single_sharing)||0, double_sharing: Number(pg.double_sharing)||0,
    triple_sharing: Number(pg.triple_sharing)||0, four_sharing: Number(pg.four_sharing)||0,
    single_room: Number(pg.single_room)||0, double_room: Number(pg.double_room)||0,
    price_1bhk: Number(pg.price_1bhk)||0, price_2bhk: Number(pg.price_2bhk)||0,
    price_3bhk: Number(pg.price_3bhk)||0, price_4bhk: Number(pg.price_4bhk)||0,
    co_living_single_room: Number(pg.co_living_single_room)||0, co_living_double_room: Number(pg.co_living_double_room)||0,
    coliving_three_sharing: Number(pg.coliving_three_sharing)||0, coliving_four_sharing: Number(pg.coliving_four_sharing)||0,
    deposit_amount: Number(pg.deposit_amount)||Number(pg.security_deposit)||0,
    available_rooms: Number(pg.available_rooms)||0,
    min_stay_months: Number(pg.min_stay_months)||0,
    food_available: bool(pg.food_available), ac_available: bool(pg.ac_available),
    wifi_available: bool(pg.wifi_available), parking_available: bool(pg.parking_available),
    is_verified: bool(pg.is_verified), ready_to_move: bool(pg.ready_to_move),
    family_allowed: bool(pg.family_allowed), attached_bathroom: bool(pg.attached_bathroom),
  }));

  /* ─ fetch ─ */
  const fetchPGs = async (pageNum=1, more=false) => {
    try {
      more ? setLoadingMore(true) : setLoading(true);
      let sp = "relevance";
      if (sort==="low") sp="price_low"; else if (sort==="high") sp="price_high";
      else if (sort==="new") sp="newest"; else if (sort==="distance" && userLoc) sp="nearest";
      let url = `/pg/search/advanced?page=${pageNum}&limit=${PAGE}&sort_by=${sp}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (userLoc && nearMe) url += `&lat=${userLoc.lat}&lng=${userLoc.lng}`;
      const res = await api.get(url);
      if (res.data?.data) {
        let raw = res.data.data;
        if (userLoc) raw = raw.map(pg => pg.latitude && pg.longitude ? { ...pg, distance: distKm(userLoc.lat, userLoc.lng, pg.latitude, pg.longitude) } : pg);
        const processed = process(raw);
        if (!more || pageNum===1) setAllPGs(processed); else setAllPGs(p => [...p, ...processed]);
        setHasMore(res.data.hasMore === true);
        setTotal(res.data.total || 0);
        setPage(pageNum);
      }
    } catch(e) { console.error(e); }
    finally { setLoading(false); setLoadingMore(false); }
  };

  const reset = useCallback(() => { setPage(1); fetchPGs(1, false); }, [search, sort, nearMe, userLoc, minB, maxB]);

  useEffect(() => { reset(); loadFavs(); }, []);
  useEffect(() => { reset(); }, [search, sort, nearMe, userLoc, minB, maxB]);

  /* ─ favourites ─ */
  const loadFavs  = () => { try { const s=localStorage.getItem("pg_favorites"); if(s) setFavorites(new Set(JSON.parse(s))); } catch {} };
  const saveFavs  = (f) => { try { localStorage.setItem("pg_favorites", JSON.stringify([...f])); } catch {} };
  const toggleFav = (pgId, e) => {
    e.stopPropagation();
    const nf = new Set(favorites);
    if (nf.has(pgId)) { nf.delete(pgId); notify("Removed from saved"); } else { nf.add(pgId); notify("✓ Saved"); }
    setFavorites(nf); saveFavs(nf);
  };

  /* ─ client filter + tab ─ */
  const displayed = React.useMemo(() => {
    let list = [...allPGs];
    if (search) list = list.filter(pg => `${pg.area||""} ${pg.city||""} ${pg.pg_name||""}`.toLowerCase().includes(search.toLowerCase()));
    list = list.filter(pg => { const r=effRent(pg); return r>=minB && r<=maxB; });
    if (amenity.food)    list = list.filter(pg => pg.food_available);
    if (amenity.ac)      list = list.filter(pg => pg.ac_available);
    if (amenity.wifi)    list = list.filter(pg => pg.wifi_available);
    if (amenity.parking) list = list.filter(pg => pg.parking_available);
    if (foodType)        list = list.filter(pg => pg.food_type === foodType);
    if (sort==="low")    list.sort((a,b) => effRent(a)-effRent(b));
    else if (sort==="high") list.sort((a,b) => effRent(b)-effRent(a));
    else if (sort==="new")  list.sort((a,b) => new Date(b.created_at)-new Date(a.created_at));
    else if (sort==="distance" && userLoc) list.sort((a,b) => (a.distance||999)-(b.distance||999));
    if (tab !== "all") list = list.filter(pg => pg.pg_category === tab);
    return list;
  }, [allPGs, search, minB, maxB, amenity, foodType, sort, userLoc, tab]);

  /* ─ contact/book ─ */
  const handleContact = (pg) => {
    if (!user) { notify("Please login to contact owner"); navigate("/login"); return; }
    setContactPG(pg);
  };

  const handleBookSubmit = async (data) => {
    try {
      if (!user) { navigate("/register"); return; }
      const token = await user.getIdToken(true);
      const res = await api.post(`/bookings/${contactPG.id}`, { room_type: data.roomType }, { headers: { Authorization: `Bearer ${token}` } });
      notify(res.data.message || "✅ Owner will contact you soon");
      if (contactPG.contact_phone) setTimeout(() => window.location.href = `tel:${contactPG.contact_phone}`, 600);
      setContactPG(null);
    } catch(err) {
      if (err.response?.data?.message?.includes("already")) {
        notify("📞 Connecting you to owner...");
        if (contactPG.contact_phone) setTimeout(() => window.location.href = `tel:${contactPG.contact_phone}`, 600);
        setContactPG(null);
      } else notify(err.response?.data?.message || "Something went wrong", true);
    }
  };

  /* ─ compare ─ */
  const toggleCompareItem = (id, e) => {
    e.stopPropagation();
    const ns = new Set(compareSet);
    if (ns.has(id)) ns.delete(id);
    else if (ns.size < 3) ns.add(id);
    else { notify("Max 3 properties"); return; }
    setCompareSet(ns);
  };

  const clearFilters = () => {
    setSearch(""); setMinB(0); setMaxB(50000); setNearMe(false); setSort("");
    setAmenity({ food:false, ac:false, wifi:false, parking:false }); setFoodType("");
  };
  const hasFilters = search || minB>0 || maxB<50000 || nearMe || sort || Object.values(amenity).some(Boolean) || foodType;

  const tabs = [
    { id:"all", label:"All" },
  ];

  if (authLoading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"60vh", flexDirection:"column", gap:14 }}>
      <div style={{ width:40, height:40, border:"3px solid #E2E8F0", borderTop:"3px solid #4F46E5", borderRadius:"50%", animation:"spin 1s linear infinite" }} />
      <span style={{ color:"#64748B", fontSize:14 }}>Loading…</span>
    </div>
  );

  return (
    <div style={{ maxWidth:1400, margin:"auto", minHeight:"100vh", padding:"0 16px 80px", fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif" }}>
      <style>{`
        @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}
        *{box-sizing:border-box}
        input:focus,select:focus{outline:2px solid #4F46E5;outline-offset:1px}
        ::-webkit-scrollbar{height:4px;width:5px}
        ::-webkit-scrollbar-track{background:#F1F5F9;border-radius:10px}
        ::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:10px}
      `}</style>

      {/* ── TOAST ── */}
      {toast && (
        <div style={{ position:"fixed", top:20, right:20, zIndex:5000, background: toast.err ? "#EF4444" : "#0F172A", color:"#fff", padding:"12px 18px", borderRadius:12, display:"flex", alignItems:"center", gap:8, boxShadow:"0 8px 28px rgba(0,0,0,0.18)", animation:"slideIn 0.3s ease", fontSize:13, fontWeight:600, maxWidth:320 }}>
          {toast.err ? <X size={14}/> : <Check size={14} color="#10B981"/>} {toast.msg}
        </div>
      )}

      {/* ══════════════════════════════════════════
          HERO — single search bar, clear headline
      ══════════════════════════════════════════ */}
      <div style={{ background:"linear-gradient(135deg,#0A1628 0%,#1E3A5F 60%,#0F2744 100%)", borderRadius:24, margin:"24px 0 32px", padding: isMobile() ? "40px 20px 36px" : "60px 48px 56px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-80, right:-80, width:320, height:320, borderRadius:"50%", background:"radial-gradient(circle,rgba(79,70,229,0.18) 0%,transparent 70%)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-40, left:"25%", width:240, height:240, borderRadius:"50%", background:"radial-gradient(circle,rgba(16,185,129,0.1) 0%,transparent 70%)", pointerEvents:"none" }} />

        <div style={{ position:"relative" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:7, background:"rgba(79,70,229,0.22)", border:"1px solid rgba(99,102,241,0.35)", borderRadius:30, padding:"5px 13px", marginBottom:18 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#10B981", animation:"spin 3s linear infinite" }} />
            <span style={{ fontSize:11, fontWeight:700, color:"#A5B4FC", letterSpacing:"0.1em", textTransform:"uppercase" }}>Bangalore's #1 PG Platform</span>
          </div>

          <h1 style={{ fontSize: isMobile() ? 28 : 48, fontWeight:900, color:"#fff", margin:"0 0 10px", lineHeight:1.1, letterSpacing:"-0.02em" }}>
            Find Your Perfect Stay<br/>
            <span style={{ background:"linear-gradient(90deg,#818CF8,#A5F3FC)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>PG · Coliving · Rentals</span>
          </h1>
          <p style={{ fontSize: isMobile() ? 14 : 16, color:"rgba(226,232,240,0.8)", margin:"0 0 28px", maxWidth:480, lineHeight:1.6 }}>
            Verified listings · Zero brokerage · Direct owner contact
          </p>

          {/* ── SINGLE SEARCH BAR ── */}
          <div style={{ display:"flex", maxWidth:560, background:"rgba(255,255,255,0.97)", borderRadius:60, overflow:"hidden", boxShadow:"0 8px 40px rgba(0,0,0,0.28)" }}>
            <div style={{ display:"flex", alignItems:"center", paddingLeft:18 }}><MapPin size={17} color="#4F46E5" /></div>
            <input
              type="text"
              placeholder="Area, city, or PG name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex:1, padding:"15px 14px", border:"none", outline:"none", fontSize:15, background:"transparent", color:"#0F172A" }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ padding:"0 12px", background:"transparent", border:"none", cursor:"pointer", color:"#94A3B8" }}><X size={15}/></button>
            )}
            <button onClick={detectLoc} disabled={locLoading}
              style={{ padding:"13px 20px", background:"linear-gradient(135deg,#4F46E5,#6366F1)", color:"#fff", border:"none", cursor:"pointer", fontWeight:700, fontSize:14, display:"flex", alignItems:"center", gap:7 }}>
              {locLoading ? <div style={{ width:15, height:15, border:"2px solid rgba(255,255,255,0.3)", borderTop:"2px solid #fff", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} /> : <Navigation size={16}/>}
              {locLoading ? "Finding…" : "Near Me"}
            </button>
          </div>

          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:18 }}>
            {["✓ Verified", "✓ No Brokerage", "✓ Instant Contact"].map(t => (
              <div key={t} style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.8)", padding:"5px 12px", borderRadius:30, fontSize:11, fontWeight:500 }}>{t}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── LOCATION BAR (shown when active) ── */}
      {userLoc && userArea && (
        <div style={{ background:"linear-gradient(135deg,#EFF6FF,#EEF2FF)", border:"1px solid #C7D2FE", borderRadius:14, padding:"11px 18px", marginBottom:24, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap", animation:"fadeUp 0.4s ease" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Navigation size={16} color="#4F46E5" />
            <span style={{ fontSize:13, fontWeight:700, color:"#312E81" }}>📍 Near {userArea} · Showing closest properties</span>
          </div>
          <button onClick={() => { setNearMe(false); setUserLoc(null); setUserArea(""); }} style={{ fontSize:12, color:"#6366F1", background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>Clear location</button>
        </div>
      )}

      {/* ── POPULAR AREAS ── */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Popular Areas</div>
        <div style={{ display:"flex", gap:7, overflowX:"auto", paddingBottom:4 }}>
          {popularAreas.map(area => {
            const active = search === area.name;
            return (
              <button key={area.name} onClick={() => setSearch(active ? "" : area.name)}
                style={{ padding:"7px 16px", borderRadius:30, border: active ? `2px solid ${area.color}` : "1.5px solid #E2E8F0", background: active ? `${area.color}12` : "#fff", color: active ? area.color : "#475569", whiteSpace:"nowrap", cursor:"pointer", fontWeight: active ? 700 : 500, fontSize:13, transition:"all 0.2s", flexShrink:0 }}>
                {area.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div style={{ background:"#fff", borderRadius:18, padding:"14px 16px", boxShadow:"0 4px 20px rgba(15,23,42,0.07)", marginBottom:28, position:"sticky", top:12, zIndex:100, border:"1px solid #E2E8F0" }}>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>

          {/* Budget */}
          <button onClick={() => setShowBudget(true)}
            style={{ padding:"9px 16px", borderRadius:30, background: (minB>0||maxB<50000) ? "#4F46E5" : "#F8FAFC", color: (minB>0||maxB<50000) ? "#fff" : "#475569", border: (minB>0||maxB<50000) ? "none" : "1.5px solid #E2E8F0", cursor:"pointer", fontWeight:600, fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
            <Coins size={14}/> {(minB>0||maxB<50000) ? `₹${fmt(minB)}–₹${fmt(maxB)}` : "Budget"}
          </button>

          {/* Filters toggle */}
          <button onClick={() => setShowFilters(p => !p)}
            style={{ padding:"9px 16px", borderRadius:30, background: showFilters ? "#4F46E5" : "#F8FAFC", color: showFilters ? "#fff" : "#475569", border: showFilters ? "none" : "1.5px solid #E2E8F0", cursor:"pointer", fontWeight:600, fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
            <SlidersHorizontal size={14}/> Filters {Object.values(amenity).filter(Boolean).length > 0 ? `(${Object.values(amenity).filter(Boolean).length})` : ""}
          </button>

          {/* Sort */}
          <select value={sort} onChange={e => setSort(e.target.value)}
            style={{ padding:"9px 14px", borderRadius:30, border:"1.5px solid #E2E8F0", background: sort ? "#4F46E5" : "#F8FAFC", color: sort ? "#fff" : "#475569", fontSize:13, fontWeight:600, cursor:"pointer", appearance:"none" }}>
            <option value="">Sort: Default</option>
            <option value="low">Price: Low → High</option>
            <option value="high">Price: High → Low</option>
            <option value="new">Newest First</option>
            {userLoc && <option value="distance">Nearest First</option>}
          </select>

          {/* Compare */}
          <button onClick={() => { setCompareMode(p => !p); if (compareMode) setCompareSet(new Set()); }}
            style={{ padding:"9px 16px", borderRadius:30, background: compareMode ? "#8B5CF6" : "#F8FAFC", color: compareMode ? "#fff" : "#475569", border: compareMode ? "none" : "1.5px solid #E2E8F0", cursor:"pointer", fontWeight:600, fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
            <BarChart size={14}/> Compare {compareMode && compareSet.size > 0 ? `(${compareSet.size})` : ""}
          </button>

          {compareMode && compareSet.size >= 2 && (
            <button onClick={() => setShowCompare(true)}
              style={{ padding:"9px 18px", borderRadius:30, background:"linear-gradient(135deg,#8B5CF6,#7C3AED)", color:"#fff", border:"none", cursor:"pointer", fontWeight:700, fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
              <BarChart size={14}/> Compare Now
            </button>
          )}

          {hasFilters && (
            <button onClick={clearFilters}
              style={{ padding:"9px 14px", borderRadius:30, background:"#FEF2F2", color:"#EF4444", border:"1.5px solid #FECACA", cursor:"pointer", fontWeight:600, fontSize:13, display:"flex", alignItems:"center", gap:5 }}>
              <X size={13}/> Clear
            </button>
          )}
        </div>

        {/* Expanded amenity filters */}
        {showFilters && (
          <div style={{ marginTop:14, paddingTop:14, borderTop:"1px solid #F1F5F9", display:"flex", gap:8, flexWrap:"wrap", animation:"fadeUp 0.2s ease" }}>
            {[
              { key:"food",    label:"Food",    icon:<Utensils size={13}/>,  color:"#10B981" },
              { key:"ac",      label:"AC",      icon:<Snowflake size={13}/>, color:"#06B6D4" },
              { key:"wifi",    label:"WiFi",    icon:<Wifi size={13}/>,      color:"#8B5CF6" },
              { key:"parking", label:"Parking", icon:<Car size={13}/>,       color:"#F59E0B" },
            ].map(({ key, label, icon, color }) => (
              <button key={key} onClick={() => setAmenity(p => ({ ...p, [key]: !p[key] }))}
                style={{ padding:"7px 14px", border: amenity[key] ? "none" : "1.5px solid #E2E8F0", background: amenity[key] ? color : "#F8FAFC", color: amenity[key] ? "#fff" : "#475569", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:5, transition:"all 0.2s" }}>
                {icon} {label}
              </button>
            ))}
            <select value={foodType} onChange={e => setFoodType(e.target.value)}
              style={{ padding:"7px 14px", border:"1.5px solid #E2E8F0", borderRadius:20, fontSize:12, background: foodType ? "#10B981" : "#F8FAFC", color: foodType ? "#fff" : "#475569", fontWeight:600, cursor:"pointer" }}>
              <option value="">Any Food</option>
              <option value="veg">Veg Only</option>
              <option value="non-veg">Non-Veg</option>
              <option value="both">Both</option>
            </select>
          </div>
        )}
      </div>

      {/* ── TYPE TABS ── */}
      <div style={{ display:"flex", gap:6, marginBottom:24, overflowX:"auto", paddingBottom:2 }}>
        {tabs.map(t => {
          const active = tab === t.id;
          const cfg = t.id !== "all" ? TYPE_CONFIG[t.id] : null;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding:"10px 22px", borderRadius:30, background: active ? (cfg?.color||"#0F172A") : "#F8FAFC", color: active ? "#fff" : "#475569", border: active ? "none" : "1.5px solid #E2E8F0", cursor:"pointer", fontSize:14, fontWeight: active ? 700 : 500, whiteSpace:"nowrap", flexShrink:0, transition:"all 0.2s", boxShadow: active ? `0 2px 10px ${cfg?.color||"#0F172A"}40` : "none" }}>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── RESULTS HEADER ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:800, color:"#0F172A", margin:"0 0 2px", letterSpacing:"-0.01em" }}>
            {tab === "all" ? "All Properties" : tabs.find(t => t.id===tab)?.label}
          </h2>
        </div>
        {hasFilters && !loading && (
          <div style={{ display:"flex", alignItems:"center", gap:6, background:"#EEF2FF", border:"1px solid #C7D2FE", borderRadius:20, padding:"5px 12px", fontSize:11, fontWeight:700, color:"#4F46E5" }}>
            <Filter size={11}/> Filters active
          </div>
        )}
      </div>

      {/* ── GRID ── */}
      {loading ? (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:22 }}>
          {Array.from({length:6}).map((_,i) => <Skeleton key={i}/>)}
        </div>
      ) : displayed.length > 0 ? (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:22, animation:"fadeUp 0.4s ease" }}>
            {displayed.map(pg => (
              <Card key={pg.id} pg={pg}
                onQuickView={(p, e) => { e.stopPropagation(); setQuickView(p); }}
                onFav={toggleFav}
                onContact={handleContact}
                onClick={p => navigate(`/pg/${p.id}`)}
                isFav={favorites.has(pg.id)}
                forCompare={compareSet.has(pg.id)}
                onSelectCompare={toggleCompareItem}
                compareMode={compareMode}
              />
            ))}
          </div>

          {/* Load more */}
          {hasMore && !loadingMore && displayed.length < total && (
            <div style={{ textAlign:"center", marginTop:44, marginBottom:20 }}>
              <button onClick={() => fetchPGs(page+1, true)}
                style={{ padding:"13px 36px", background:"linear-gradient(135deg,#4F46E5,#6366F1)", color:"#fff", border:"none", borderRadius:14, fontSize:14, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 18px rgba(79,70,229,0.28)", display:"inline-flex", alignItems:"center", gap:8 }}>
                Load More <ChevronDown size={15}/>
              </button>
              <div style={{ fontSize:12, color:"#94A3B8", marginTop:8 }}>Showing {displayed.length} of {total}</div>
            </div>
          )}

          {loadingMore && (
            <div style={{ textAlign:"center", marginTop:28 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:10, background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:30, padding:"10px 20px" }}>
                <div style={{ width:16, height:16, border:"2px solid #E2E8F0", borderTop:"2px solid #4F46E5", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
                <span style={{ fontSize:13, color:"#475569", fontWeight:600 }}>Loading more…</span>
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign:"center", padding:"72px 20px", background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:20, animation:"fadeUp 0.4s ease" }}>
          <div style={{ width:60, height:60, background:"#EEF2FF", borderRadius:18, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
            <Search size={26} color="#4F46E5"/>
          </div>
          <h3 style={{ fontSize:18, fontWeight:700, color:"#1E293B", margin:"0 0 8px" }}>No properties found</h3>
          <p style={{ color:"#64748B", margin:"0 0 24px", fontSize:14 }}>Try a different area or clear your filters</p>
          <button onClick={clearFilters} style={{ padding:"11px 28px", background:"linear-gradient(135deg,#4F46E5,#6366F1)", color:"#fff", border:"none", borderRadius:12, cursor:"pointer", fontWeight:700, fontSize:14 }}>
            Clear Filters
          </button>
        </div>
      )}

      {/* ── MODALS ── */}
      {showBudget && <BudgetModal min={minB} max={maxB} onChange={(a,b) => { setMinB(a); setMaxB(b); notify(`Budget: ₹${fmt(a)} – ₹${fmt(b)}`); }} onClose={() => setShowBudget(false)} />}
      {quickView  && <QuickView pg={quickView} onClose={() => setQuickView(null)} onContact={handleContact} onFav={(id,fav) => { const nf=new Set(favorites); fav?nf.add(id):nf.delete(id); setFavorites(nf); saveFavs(nf); }} isFav={favorites.has(quickView.id)} />}
      {contactPG  && <ContactModal pg={contactPG} onClose={() => setContactPG(null)} onSubmit={handleBookSubmit} />}
      {showCompare && <CompareModal ids={compareSet} allPGs={allPGs} onClose={() => { setShowCompare(false); setCompareSet(new Set()); setCompareMode(false); }} />}

      {/* ── MOBILE STICKY CTA ── */}
      {isMobile() && !compareMode && displayed.length > 0 && (
        <div style={{ position:"fixed", bottom:0, left:0, right:0, padding:"10px 16px 16px", background:"linear-gradient(to top,#fff 75%,transparent)", zIndex:900 }}>
          <button onClick={() => handleContact(displayed[0])}
            style={{ width:"100%", padding:"14px", background:"linear-gradient(135deg,#4F46E5,#6366F1)", color:"#fff", border:"none", borderRadius:14, fontSize:15, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:9, boxShadow:"0 4px 20px rgba(79,70,229,0.32)" }}>
            <MessageCircle size={18}/> Contact Owner
          </button>
        </div>
      )}
    </div>
  );
}

export default UserPGSearch;